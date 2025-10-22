import { BentoGrid } from "@/components/bento-grid";
import { PageProps } from "@/utils/types/page";
import { IonContent, IonHeader, IonToolbar, IonList, IonInfiniteScroll, IonInfiniteScrollContent } from "@ionic/react";
import { Apple } from "lucide-react";
import Card from "./components/card";
import { useCallback, useEffect, useState, useRef } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/reducers/api_int";
import { IconLiz } from "./components/ionc-liz";

// Definir el tipo para los productos
interface Producto {
    id: string;
    nombre: string;
    categoria: string;
    unidad: string;
    precio: number;
    cantidad: number;
    descuento: number;
}

// Tipo para la respuesta de la API
interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

const Productos: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const [getData, { isLoading }] = useGetWithFiltersGeneralInIntelisisMutation();

    const [items, setItems] = useState<Producto[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const initialLoad = useRef(true);
    const isFetching = useRef(false);

    const generateItems = useCallback(async (currentPage: number) => {
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
                    INNER JOIN ListaPreciosDUnidad AS lpu
                        ON art.Articulo = lpu.Articulo
                        AND cb.Unidad = lpu.Unidad
                        AND lpu.Lista = '(Precio Lista)'
                    INNER JOIN ArtUnidad AS au
                        ON art.Articulo = au.Articulo
                        AND lpu.Unidad = au.Unidad
                    INNER JOIN ArtDisponible AS ad On Almacen = 'ALMMAYO' and art.Articulo = ad.Articulo
                    LEFT JOIN Oferta AS ofr On ofr.Articulo = art.Articulo and ofr.FechaD < GETDATE()
                    and ofr.FechaA > GETDATE()
                    LEFT JOIN OfertaD AS ofrd On ofrd.Articulo = art.Articulo 
                `,
                pageSize: 10,
                page: currentPage,
                filtros: {
                    "Filtros": [],
                    "Selects": [
                        { "key": "cb.Codigo" },
                        { "key": "cb.Cuenta" },
                        { "key": "art.Grupo" },
                        { "key": "art.Descripcion1" },
                        { "key": "lpu.Unidad" },
                        { "key": "lpu.Precio" },
                        /* { "key": "ofrd.Precio", "alias": "Descuento" }, */
                        /* { "key": "au.Unidad", "alias": "UnidadFactor" }, */
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
                            "Key": "cb.Codigo",
                            "Direction": "DESC"
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
                        id: item.Codigo || `item-${Date.now()}-${Math.random()}`,
                        nombre: item.Descripcion1 || "Sin nombre",
                        categoria: item.Grupo || "Sin categoría",
                        unidad: item.Unidad || "Unidad",
                        precio: item.Precio || 0,
                        cantidad: item.Factor || 1,
                        descuento: item.Descuento || 0,
                    }));

                    setItems(prevItems => {
                        const newItems = currentPage === 1 ? mappedItems : [...prevItems, ...mappedItems];
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
            console.log('🏁 Fetch completado');
        }
    }, [getData]);

    // Efecto para carga inicial
    useEffect(() => {
        if (initialLoad.current) {
            console.log('🚀 Carga inicial');
            generateItems(1);
        }
    }, []);

    // Efecto para cuando cambia la página
    useEffect(() => {
        if (page > 1 && !initialLoad.current) {
            console.log(`🔄 Cambio de página a: ${page}`);
            generateItems(page);
        }
    }, [page]);

    const handleInfiniteScroll = useCallback(async (event: any) => {
        console.log('🎯 Infinite scroll activado');
        console.log('📊 Estado - hasMore:', hasMore, 'isLoading:', isLoading, 'isFetching:', isFetching.current);

        if (!hasMore) {
            console.log('⏹️  No hay más datos, deshabilitando scroll');
            event.target.complete();
            event.target.disabled = true;
            return;
        }

        if (isLoading || isFetching.current) {
            console.log('⏳ Ya está cargando, completando sin acción');
            event.target.complete();
            return;
        }

        console.log('⬆️  Incrementando página...');
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            console.log(`📈 Nueva página: ${nextPage}`);
            return nextPage;
        });
        event.target.complete();
        console.log('✅ Scroll completado');

    }, [hasMore, isLoading]);

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
                className="custom-toolbar z-50 -top-16"
            >
                <IonToolbar className="pt-10">
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>
            <section className="px-4 max-w-6xl mx-auto">
                <ul className="flex gap-3 overflow-x-scroll scrollbar-hide w-full mx-auto md:px-0 lg:px-0 px-6 pb-4">
                    {Array.from({ length: 23 }).map((_, index) => (
                        <li className="flex flex-col items-center min-w-fit" key={index}>
                            <Apple className="size-5 text-red-500" />
                            <p className="text-red-500 text-xs">Frutas</p>
                        </li>
                    ))}
                </ul>

                <IonList>
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
                    disabled={!hasMore || isLoading}
                >
                    <IonInfiniteScrollContent
                        loadingText={hasMore ? "Cargando más productos..." : "No hay más productos"}
                    ></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </section>
        </IonContent>
    );
}

export default Productos;