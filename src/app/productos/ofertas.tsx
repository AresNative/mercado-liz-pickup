import { PageProps } from "@/utils/types/page";
import { IonContent, IonList, IonButton } from "@ionic/react";
import Card from "./components/card";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import CategorySlider from "./components/categories";
import PromoBanner from "./components/banner";
import Badge from "@/components/badge";
import { formatValue } from "@/utils/constants/format-values";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Producto } from "@/utils/types/page";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { CategoryRow } from "./components/categories-section";

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

// Estado de paginación/artículos de UNA categoría individual.
interface CategoryState {
    items: Producto[];
    page: number;
    hasMore: boolean;
    isLoading: boolean;
    total: number;
}

const PAGE_SIZE_POR_CATEGORIA = 5;

// Mismo JOIN que antes, parametrizado por categoría (o sin filtro, para
// descubrir qué categorías tienen ofertas vigentes).
const tablaOfertas = (grupoFiltro?: string) =>
    `art INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND art.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 ${grupoFiltro ? `AND art.Grupo = '${grupoFiltro}'` : ''} INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad on art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 AND ad.Almacen = 'ALMMAYO' AND (ad.DispMenosApartado / au.Factor) > 0 INNER JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.FechaD <= GETDATE() AND ofr.FechaA >= GETDATE() AND ofr.SucursalDestino = '4' OR ofr.Estatus = 'VIGENTE' AND ofr.FechaD <= GETDATE() AND ofr.FechaA >= GETDATE() AND ofr.TodasSucursales = 'true' INNER JOIN OfertaD AS ofrd ON ofr.ID = ofrd.ID AND ofrd.Articulo = art.Articulo AND ofrd.Unidad = art.Unidad AND ofrd.Precio > 0`;

const mapApiItemToProducto = (item: any): Producto => ({
    id: item.Articulo + "-" + item.Unidad + "-" + item.Factor,
    articulo: item.Articulo || "Articulo",
    nombre: item.Descripcion1 || "Sin nombre",
    categoria: item.Grupo || "Sin categoría",
    unidad: item.Unidad || "Unidad",
    precio: item.Precio || 0,
    cantidad: item.Cantidad || 1,
    factor: item.Factor || 1,
    impuesto1: item.Impuesto1 || 0,
    impuesto2: item.Impuesto2 || 0,
    tipoImpuesto1: item.TipoImpuesto1 || 0,
    tipoImpuesto2: item.TipoImpuesto2 || 0,
    descuento: item.Porcentaje ? item.Precio - ((item.Porcentaje / 100) * item.Precio) : item.Descuento || 0,
});

const Ofertas: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const cat = useAppSelector((state: RootState) => state.filterData);
    const categoriaFiltro = cat?.key?.value || '';

    const [getData] = useGetWithFiltersGeneralInIntelisisMutation();

    // Categorías visibles y su estado de paginación individual: cada
    // categoría carga 5 artículos a la vez, con su propio scroll horizontal.
    const [categorias, setCategorias] = useState<string[]>([]);
    const [categoriaData, setCategoriaData] = useState<Record<string, CategoryState>>({});
    const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);

    // Favoritos
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [favoriteItems, setFavoriteItems] = useState<Producto[]>([]);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const isFavoritesSection = activeSection === 'Favoritos';

    const getFavoriteProducts = useCallback((): Producto[] => {
        try {
            const favorites = getLocalStorageItem("favoritos");
            const parsedFavorites = favorites ? JSON.parse(favorites) : [];
            setFavoriteCount(parsedFavorites.length);
            return parsedFavorites;
        } catch (e) {
            console.error('Error al leer favoritos del localStorage', e);
            setFavoriteCount(0);
            return [];
        }
    }, []);

    useEffect(() => {
        setFavoriteItems(getFavoriteProducts());
    }, [isFavoritesSection, getFavoriteProducts]);

    // Agrupamos los favoritos por categoría con la misma forma (CategoryState)
    // que usamos para las categorías traídas del servidor, así ambas vistas
    // se pueden renderizar con el mismo componente CategoryRow.
    const favoriteCategoryEntries = useMemo<[string, CategoryState][]>(() => {
        const groups = new Map<string, Producto[]>();
        favoriteItems.forEach((producto) => {
            const key = producto.categoria || "Sin categoría";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(producto);
        });
        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([nombre, items]) => [
                nombre,
                { items, page: 1, hasMore: false, isLoading: false, total: items.length },
            ]);
    }, [favoriteItems]);

    const fetchCategorias = useCallback(async () => {
        setIsLoadingCategorias(true);
        try {
            const result = await getData({
                table: tablaOfertas(),
                pageSize: 10000,
                page: 1,
                filtros: {
                    Selects: [{ Key: "art.Grupo" }],
                    Order: [{ Key: "art.Grupo", Direction: "ASC" }],
                },
            });
            if ('data' in result && result.data) {
                const apiData: ApiResponse = result.data;
                const nombres = new Set<string>();
                (apiData.data || []).forEach((r: any) => {
                    if (r.Grupo) nombres.add(r.Grupo);
                });
                setCategorias(Array.from(nombres).sort());
            }
        } catch (error) {
            console.error("Error obteniendo categorías:", error);
            setCategorias([]);
        } finally {
            setIsLoadingCategorias(false);
        }
    }, [getData]);

    // ── Cargar una página (5 artículos) de UNA categoría específica ─────────
    const fetchCategoriaPage = useCallback(async (nombreCategoria: string, pagina: number) => {
        setCategoriaData(prev => ({
            ...prev,
            [nombreCategoria]: {
                ...(prev[nombreCategoria] ?? { items: [], page: 0, hasMore: true, total: 0 }),
                isLoading: true,
            },
        }));

        try {
            const result = await getData({
                table: tablaOfertas(nombreCategoria),
                pageSize: PAGE_SIZE_POR_CATEGORIA,
                page: pagina,
                filtros: {
                    Selects: [
                        { Key: "art.Articulo" },
                        { Key: "art.Grupo" },
                        { Key: "art.Descripcion1" },
                        { Key: "lpu.Unidad" },
                        { Key: "art.Impuesto1" },
                        { Key: "art.Impuesto2" },
                        { Key: "art.TipoImpuesto1" },
                        { Key: "art.TipoImpuesto2" },
                        { Key: "lpu.Precio" },
                        { Key: "ofrd.Precio", alias: "Descuento" },
                        { Key: "ofrd.Porcentaje" },
                        { Key: "art.Unidad", alias: "UnidadFactor" },
                        { Key: "art.Factor" },
                    ],
                    Agregaciones: [
                        { Key: "ad.DispMenosApartado", Operation: "SUM", Alias: "Cantidad" },
                    ],
                    Order: [{ Key: "Descripcion1", Direction: "DESC" }],
                },
                signal: undefined,
            });

            if ('data' in result && result.data) {
                const apiData: ApiResponse = result.data;
                const nuevosItems = (apiData.data || []).map(mapApiItemToProducto);

                setCategoriaData(prev => {
                    const anterior = prev[nombreCategoria] ?? { items: [], page: 0, hasMore: true, total: 0 };
                    return {
                        ...prev,
                        [nombreCategoria]: {
                            items: pagina === 1 ? nuevosItems : [...anterior.items, ...nuevosItems],
                            page: pagina,
                            hasMore: pagina < (apiData.totalPages || 1),
                            total: apiData.totalRecords ?? anterior.total,
                            isLoading: false,
                        },
                    };
                });
            }
        } catch (error) {
            console.error(`❌ Error cargando artículos de "${nombreCategoria}":`, error);
            setCategoriaData(prev => ({
                ...prev,
                [nombreCategoria]: {
                    ...(prev[nombreCategoria] ?? { items: [], page: 0, total: 0 }),
                    isLoading: false,
                    hasMore: false,
                },
            }));
        }
    }, [getData]);

    // Al montar, o cuando cambia el filtro global de categoría (CategorySlider),
    // recalculamos qué categorías mostrar. Si hay una categoría específica
    // seleccionada, solo mostramos esa (una sola fila); si no, descubrimos
    // todas las que tengan ofertas vigentes.
    useEffect(() => {
        if (isFavoritesSection) return;
        setCategoriaData({});
        if (categoriaFiltro && categoriaFiltro !== 'TODO') {
            setCategorias([categoriaFiltro]);
            setIsLoadingCategorias(false);
        } else {
            fetchCategorias();
        }
    }, [categoriaFiltro, isFavoritesSection, fetchCategorias]);

    // Carga la primera página (5 artículos) de cada categoría nueva que
    // todavía no tenga datos cargados.
    useEffect(() => {
        if (isFavoritesSection) return;
        categorias.forEach((nombreCategoria) => {
            if (!categoriaData[nombreCategoria]) {
                fetchCategoriaPage(nombreCategoria, 1);
            }
        });
    }, [categorias, isFavoritesSection, categoriaData, fetchCategoriaPage]);

    const handleSectionChange = useCallback((section: string) => {
        setActiveSection(prev => (prev === section ? null : section));
    }, []);

    const categoriaEntries = useMemo<[string, CategoryState][]>(() => (
        categorias.map((nombreCategoria) => [
            nombreCategoria,
            categoriaData[nombreCategoria] ?? { items: [], page: 0, hasMore: true, isLoading: true, total: 0 },
        ])
    ), [categorias, categoriaData]);

    const totalOfertas = useMemo(
        () => categoriaEntries.reduce((suma, [, data]) => suma + (data.total || 0), 0),
        [categoriaEntries]
    );

    const entriesAMostrar = isFavoritesSection ? favoriteCategoryEntries : categoriaEntries;
    const sinResultados = isFavoritesSection
        ? favoriteItems.length === 0
        : !isLoadingCategorias && entriesAMostrar.length === 0;

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}
        >
            <section className="px-4 py-4 max-w-6xl mx-auto">
                {/* <PromoBanner items={[
                    {
                        id: "1",
                        backgroundColor: "bg-red-600",
                        content: {
                            title: "🔥 Ofertas Especiales",
                            description: "Descuentos exclusivos por tiempo limitado",
                            position: "center",
                            textColor: "text-white",
                            buttonColor: "bg-white",
                            buttonTextColor: "text-red-600"
                        }
                    },
                    {
                        id: "2",
                        gradient: "bg-gradient-to-r from-orange-500 to-red-500",
                        content: {
                            title: "🎯 Promociones Destacadas",
                            description: "Aprovecha nuestras mejores ofertas de la temporada",
                            position: "left",
                            textColor: "text-white",
                            buttonColor: "bg-yellow-400",
                        }
                    },
                ]} autoPlay={true} interval={3000} showControls={true} showIndicators={true} /> */}
                <CategorySlider />

                <section className="sticky top-2 flex aling-center gap-2 overflow-x-auto scrollbar-hide z-50 bg-white/70 dark:bg-black/70 py-2 px-2 my-4 rounded-lg backdrop-blur-md border border-gray-200 dark:border-gray-700">
                    {[
                        { key: null, label: "Ofertas", count: totalOfertas },
                        { key: 'Favoritos', label: "Favoritos", count: favoriteCount }
                    ].map((section) => (
                        <button
                            key={section.key || 'ofertas'}
                            onClick={() => handleSectionChange(section.key!)}
                            className="flex items-center gap-2 h-10 cursor-pointer focus:outline-none"
                        >
                            <Badge
                                color={activeSection === section.key ? "purple" : "gray"}
                                text={`${section.label} ${section.count > 0 ? `(${formatValue(section.count, "number")})` : ''}`}
                            />
                        </button>
                    ))}
                    <IonButton
                        fill="clear"
                        expand="full"
                        routerLink="/productos"
                        routerDirection="none"
                        className="custom flex items-center gap-2 cursor-pointer focus:outline-none transition-opacity hover:opacity-90 flex-shrink-0">
                        <Badge color="gray" text="Ver todos" />
                    </IonButton>
                </section>

                <IonList className="bg-transparent">
                    {entriesAMostrar.map(([nombreCategoria, data]) => (
                        <CategoryRow
                            key={nombreCategoria}
                            title={nombreCategoria}
                            items={data.items}
                            hasMore={data.hasMore}
                            isLoading={data.isLoading}
                            onLoadMore={() => fetchCategoriaPage(nombreCategoria, data.page + 1)}
                            renderItem={(producto, index) => (
                                <Card
                                    key={`${producto.id}-${index}`}
                                    producto={producto}
                                />
                            )}
                        />
                    ))}
                </IonList>

                {!isFavoritesSection && isLoadingCategorias && (
                    <div className="text-center py-4">
                        <p>Cargando ofertas…</p>
                    </div>
                )}

                {sinResultados && (
                    <div className="text-center py-8">
                        <p>{isFavoritesSection ? "No tienes favoritos guardados" : "No se encontraron ofertas"}</p>
                    </div>
                )}
            </section>
        </IonContent>
    );
}

export default Ofertas;