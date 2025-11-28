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
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { Producto } from "@/utils/types/page";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const Productos: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const cat = useAppSelector((state: RootState) => state.filterData);
    const categoria = cat?.key?.value || '';

    const [getData, { isLoading }] = useGetWithFiltersGeneralInIntelisisMutation();

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
                table: `
                CB AS cb
                    INNER JOIN Art AS art
                        ON cb.Cuenta = art.Articulo
                        ${categoria && categoria !== 'TODO' ? `AND art.Grupo = '${categoria}'` : ''}
                    INNER JOIN ListaPreciosDUnidad AS lpu
                        ON art.Articulo = lpu.Articulo
                        AND cb.Unidad = lpu.Unidad
                        AND lpu.Lista = '(Precio Lista)'
                        AND lpu.Precio > 0
                    INNER JOIN ArtUnidad AS au
                        ON art.Articulo = au.Articulo
                        AND lpu.Unidad = au.Unidad
                    INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' AND art.Articulo = ad.Articulo AND ad.DispMenosApartado > 0 AND (ad.DispMenosApartado / au.Factor) > 0
                    LEFT JOIN (
                                    SELECT *,
                                        ROW_NUMBER() OVER (PARTITION BY Articulo, Unidad ORDER BY id DESC) AS rn
                                    FROM OfertaD
                                ) AS ofrd On ofrd.Articulo = art.Articulo AND ofrd.Unidad = cb.Unidad AND ofrd.rn = 1
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo AND ofr.FechaD < GETDATE() and ofr.FechaA > GETDATE() 
                `,
                pageSize: 10,
                page: currentPage,
                filtros: {
                    "Filtros": [],
                    "Selects": [
                        { "key": "cb.Codigo" },
                        { "key": "art.Articulo" },
                        { "key": "art.Grupo" },
                        { "key": "art.Descripcion1" },
                        { "key": "art.Impuesto1" },
                        { "key": "art.Impuesto2" },
                        { "key": "art.TipoImpuesto1" },
                        { "key": "art.TipoImpuesto2" },
                        { "key": "lpu.Unidad" },
                        { "key": "lpu.Precio" },
                        { "key": "ofrd.Precio", "alias": "Descuento" },
                        { "key": "au.Unidad", "alias": "UnidadFactor" },
                        { "key": "au.Factor" }
                    ],
                    "Agregaciones": [
                        {
                            "Key": "ad.DispMenosApartado",
                            "Operation": "SUM",
                            "Alias": "Cantidad"
                        }
                    ],
                    "Order": [
                        {
                            "Key": "art.Descripcion1",
                            "Direction": "ASC"
                        }
                    ]
                },
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
                        id: item.Codigo + "-" + item.Unidad,
                        codigo: item.Codigo || "0000",
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
                        descuento: item.Descuento || 0,
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

            <section className="px-4 py-4 max-w-6xl mx-auto">
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

                <section className="sticky top-2 flex aling-center gap-2 overflow-x-auto scrollbar-hide z-50 bg-white/70 dark:bg-black/70 py-2 px-2 my-4 rounded-lg backdrop-blur-md border border-gray-200 dark:border-gray-700">
                    {[
                        { key: null, label: "Productos", count: totalRecords },
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
                    <a href="/ofertas" className="flex items-center gap-2 h-10 cursor-pointer focus:outline-none">
                        <Badge color="gray" text="Solo ofertas" />
                    </a>
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