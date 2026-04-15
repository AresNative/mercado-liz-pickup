import { BentoGrid } from "@/components/bento-grid";
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonList, IonInfiniteScroll, IonInfiniteScrollContent } from "@ionic/react";
import Card from "./components/card";
import { useCallback, useEffect, useState, useRef } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { IconLiz } from "./components/ionc-liz";
import CategorySlider from "./components/categories";
import PromoBanner from "./components/banner";
import Badge from "@/components/badge";
import { formatValue } from "@/utils/constants/format-values";
import { getLocalStorageItem, removeFromLocalStorage } from "@/utils/functions/local-storage";
import { Producto } from "@/utils/types/page";
import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { Sucursales } from "@/utils/data/sucursales";
import { clearAll } from "@/hooks/slices/app";
import { clearCart } from "@/hooks/slices/cart";
import { useHistory } from "react-router";

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const Productos: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const dispatch = useAppDispatch()
    const history = useHistory()
    const cat = useAppSelector((state: RootState) => state.filterData);
    const categoria = cat?.key?.value || '';
    const sucursal = getLocalStorageItem("sucursal") ?? useAppSelector((state: any) => state.app.sucursal)

    // Estado local sincronizado con Redux
    const [selectedBranch, setSelectedBranch] = useState<(typeof Sucursales)[0] | null>(
        () => Sucursales.find(b => b.id === sucursal?.id) || null
    )
    const [getData, { isLoading }] = useGetWithFiltersGeneralInIntelisisMutation();
    // Cambiar sucursal
    const changeBranch = async () => {
        await removeFromLocalStorage("sucursal") // Limpiar localStorage
        dispatch(clearAll()) // Limpiar Redux
        dispatch(clearCart()) // Limpiar Redux
        history.push('/') // Redirigir a selección
    }
    //gestion de data
    const [items, setItems] = useState<Producto[]>([]);
    const [hasMore, setHasMore] = useState(true);

    //Conteo de articulos y pantallas
    const [totalRecords, setTotalRecords] = useState(1);
    const [page, setPage] = useState(1);

    //Secciones de pantalla, favoritos | todos | promociones | combos
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [favoriteCount, setFavoriteCount] = useState(0);

    const initialLoad = useRef(true);
    const isFetching = useRef(false);
    const previousCategoria = useRef(categoria); // Ref para trackear cambios de categoría

    const isFavoritesSection = activeSection === 'favoritos';

    // Get favorite products
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
    // Update favorite count when storage changes
    useEffect(() => {
        setFavoriteCount(getFavoriteProducts().length);
    }, [isFavoritesSection, getFavoriteProducts]);

    const generateItems = useCallback(async (currentPage: number, isNewCategory: boolean = false) => {
        // Prevenir múltiples llamadas simultáneas
        if (isFetching.current) {
            return;
        }

        try {
            isFetching.current = true;

            const result = await getData({
                //INNER JOIN CB AS cb ON art.Articulo = cb.Cuenta AND cb.Unidad = art.Unidad 
                table: `art INNER JOIN ListaPreciosDUnidad AS lpu ON art.Articulo = lpu.Articulo AND art.Unidad = lpu.Unidad AND lpu.Lista = '(Precio Lista)' AND lpu.Precio > 0 ${categoria && categoria !== 'TODO' ? `AND art.Grupo = '${categoria}'` : ''} INNER JOIN ArtUnidad AS au ON art.Articulo = au.Articulo AND lpu.Unidad = au.Unidad INNER JOIN ArtDisponible AS ad on art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 AND ad.Almacen = 'ALMMAYO' AND (ad.DispMenosApartado / au.Factor) > 0 LEFT JOIN Oferta AS ofr ON ofr.Estatus = 'VIGENTE' AND ofr.FechaD < GETDATE() AND ofr.FechaA > GETDATE() LEFT JOIN OfertaD AS ofrd ON ofr.ID = ofrd.ID AND  ofrd.Articulo = art.Articulo AND ofrd.Unidad = art.Unidad  AND ofrd.Sucursal = '4'  AND ofrd.Precio > 0`,
                filtros: {
                    Selects: [
                        /* { Key: "cb.Codigo" }, */
                        { Key: "art.Articulo" },
                        { Key: "art.Grupo" },
                        { Key: "art.Descripcion1" },
                        { Key: "art.Impuesto1" },
                        { Key: "art.Impuesto2" },
                        { Key: "art.TipoImpuesto1" },
                        { Key: "art.TipoImpuesto2" },
                        { Key: "lpu.Unidad" },
                        { Key: "lpu.Precio" },
                        { Key: "ofrd.Precio", Alias: "Descuento" },
                        { Key: "ofrd.Porcentaje" },
                        { Key: "au.Unidad", Alias: "UnidadFactor" },
                        { Key: "au.Factor" }
                    ],
                    Agregaciones: [
                        {
                            Key: "ad.DispMenosApartado",
                            Operation: "SUM",
                            Alias: "Cantidad"
                        }
                    ],
                    Order: [
                        {
                            Key: "Descripcion1",
                            Direction: "ASC"
                        }
                    ],
                },
                    pageSize: 10,
                    page: currentPage,
                signal: undefined,
            });

            // Verificar si la respuesta tiene datos
            if ('data' in result && result.data) {
                const apiData: ApiResponse = result.data;

                // Actualizar totalPages con la información de la API
                if (initialLoad.current) {
                    initialLoad.current = false;
                }

                if (apiData.data && apiData.data.length > 0) {
                    // Mapear los datos de la API al formato de Producto
                    const mappedItems: Producto[] = apiData.data.map((item: any) => ({
                        id: item.Articulo + "-" + item.Unidad + "-" + item.Factor,
                        /* codigo: item.Codigo || "0000", */
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
                    }));
                    setTotalRecords(apiData.totalRecords)

                    setItems(prevItems => {
                        const newItems = currentPage === 1 || isNewCategory ? mappedItems : [...prevItems, ...mappedItems];
                        return newItems;
                    });

                    // Verificar si hay más páginas disponibles
                    const hasMoreData = currentPage < apiData.totalPages;
                    setHasMore(hasMoreData);
                } else {
                    // No hay datos en esta página
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            setHasMore(false);
        } finally {
            isFetching.current = false;
            //console.log('🏁 Fetch completado');
        }
    }, [categoria, getData]);

    // Efecto para detectar cambios de categoría y resetear datos
    useEffect(() => {
        if (previousCategoria.current !== categoria && !initialLoad.current) {
            //console.log('🔄 Cambio de categoría detectado:', previousCategoria.current, '->', categoria);

            // Resetear estado
            setItems([]);
            setPage(1);
            setHasMore(true);
            initialLoad.current = true;

            // Hacer nueva consulta con la categoría actual
            generateItems(1, true);

            // Actualizar la referencia
            previousCategoria.current = categoria;
        }
    }, [categoria, generateItems]);

    // Efecto para carga inicial
    useEffect(() => {
        if (initialLoad.current) {
            //console.log('🚀 Carga inicial');
            generateItems(1);
            previousCategoria.current = categoria; // Inicializar la referencia
        }
    }, []);

    // Efecto para cuando cambia la página
    useEffect(() => {
        if (page > 1 && !initialLoad.current) {
            //console.log(`🔄 Cambio de página a: ${page}`);
            generateItems(page);
        }
    }, [page]);


    const handleInfiniteScroll = useCallback(async (event: any) => {
        //console.log('🎯 Infinite scroll activado');
        //console.log('📊 Estado - hasMore:', hasMore, 'isLoading:', isLoading, 'isFetching:', isFetching.current);

        if (!hasMore) {
            //console.log('⏹️  No hay más datos, deshabilitando scroll');
            event.target.complete();
            event.target.disabled = true;
            return;
        }

        if (isLoading || isFetching.current) {
            //console.log('⏳ Ya está cargando, completando sin acción');
            event.target.complete();
            return;
        }

        //console.log('⬆️  Incrementando página...');
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            //console.log(`📈 Nueva página: ${nextPage}`);
            return nextPage;
        });
        event.target.complete();
        //console.log('✅ Scroll completado');

    }, [hasMore, isLoading]);

    const handleSectionChange = useCallback((section: string) => {
        const newSection = activeSection === section ? null : section;
        setActiveSection(newSection);

        if (newSection === 'Favoritos') {
            setItems(getFavoriteProducts());
        } else {
            // Resetear para cargar desde el inicio
            setPage(1);
            setItems([]);
            setHasMore(true);
            generateItems(1, true);
        }
    }, [activeSection, getFavoriteProducts, generateItems]);

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}
        >
            <IonHeader
                collapse="condense"
                className="custom-toolbar h-fit absolute -top-0"
            >
                <IonToolbar>
                    <a className='decoration-none cursor-pointer' href='/productos'>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>
            <section className="px-4 py-4 max-w-6xl mx-auto md:mb-0 mb-16">
                <PromoBanner items={[
                    {
                        id: "1",
                        backgroundColor: "bg-blue-600",
                        content: {
                            title: "Bienvenido a nuestra tienda",
                            description: "Descubre nuestros productos exclusivos",
                            position: "center",
                            textColor: "text-white",
                            buttonColor: "bg-white",
                            buttonTextColor: "text-blue-600"
                        }
                    },
                    {
                        id: "2",
                        gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
                        content: {
                            title: "Nuevas Funcionalidades",
                            subtitle: "Actualización de temporada",
                            description: "Hemos añadido nuevas características para mejorar tu experiencia",
                            position: "left",
                            textColor: "text-white",
                            buttonColor: "bg-yellow-400",
                        }
                    },
                ]} autoPlay={true} interval={3000} showControls={true} showIndicators={true} />
                <CategorySlider />

                <section className="sticky top-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide z-50 bg-white/70 dark:bg-black/70 py-3 px-4 sm:py-2 sm:px-2 my-4 rounded-lg backdrop-blur-md border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                        {[
                            { key: null, label: "Productos", count: totalRecords },
                            { key: 'Favoritos', label: "Favoritos", count: favoriteCount }
                        ].map((section) => (
                            <button
                                key={section.key || 'ofertas'}
                                onClick={() => handleSectionChange(section.key!)}
                                className="flex items-center gap-2 h-10 cursor-pointer focus:outline-none transition-opacity hover:opacity-90 flex-shrink-0"
                            >
                                <Badge
                                    color={activeSection === section.key ? "purple" : "gray"}
                                    text={`${section.label} ${section.count > 0 ? `(${formatValue(section.count, "number")})` : ''}`}
                                />
                            </button>
                        ))}
                        <a
                            href="/ofertas"
                            className="flex items-center gap-2 h-10 cursor-pointer focus:outline-none transition-opacity hover:opacity-90 flex-shrink-0"
                        >
                            <Badge color="gray" text="Solo ofertas" />
                        </a>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-shrink-0 sm:ml-auto">
                        {selectedBranch && (
                            <div className="sm:flex items-center">
                                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                    Almacén: <strong className="text-gray-700 dark:text-gray-300 ml-1">{selectedBranch.name}</strong>
                                </span>
                            </div>
                        )}
                        <button
                            onClick={changeBranch}
                            className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 underline hover:text-purple-900 dark:hover:text-purple-300 transition-colors whitespace-nowrap"
                        >
                            Cambiar
                        </button>
                    </div>
                </section>

                <IonList className="bg-transparent">
                    <BentoGrid cols={5}>
                        {items.map((producto, index) => (
                            <Card
                                key={`${producto.id}-${index}`}
                                producto={producto}
                            />
                        ))}
                    </BentoGrid>
                </IonList>

                {isLoading && (
                    <div className="text-center py-4">
                        <p>Cargando más productos...</p>
                    </div>
                )}

                {items.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                        <p>No se encontraron productos</p>
                    </div>
                )}

                <IonInfiniteScroll
                    onIonInfinite={handleInfiniteScroll}
                    threshold="100px"
                    disabled={!hasMore || isLoading || activeSection === "Favoritos"}
                >
                    <IonInfiniteScrollContent
                        loadingText={hasMore ? "Cargando más productos..." : "No hay más productos"}
                    ></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </section>
        </IonContent >
    );
}

export default Productos;