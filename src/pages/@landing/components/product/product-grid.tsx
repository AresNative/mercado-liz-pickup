import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IonInfiniteScroll, IonInfiniteScrollContent, IonList } from "@ionic/react"
import ProductCard from "./product-card"
import Badge from "@/components/badge"
import { Product } from "@/utils/data/example-data"
import { useGetArticulosQuery } from "@/hooks/reducers/api_int"
import { mapApiProductToAppProduct } from "../../utils/fromat-data"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { clearFilters } from "@/hooks/reducers/filter"
import { getLocalStorageItem } from "@/utils/functions/local-storage"

const PAGE_SIZE = 10

const ProductGrid: React.FC = () => {
    const [page, setPage] = useState(1);
    const [combinedData, setCombinedData] = useState<Product[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now()); // Fuerza recarga
    const dispatch = useAppDispatch();

    const categoria = useAppSelector((state) => state.filterData.key?.value);

    const precio = getLocalStorageItem("sucursal").precio ?? useAppSelector((state) => state.app.sucursal.precio);

    const { data, isFetching, error } = useGetArticulosQuery({
        page,
        pageSize: PAGE_SIZE,
        filtro: "",
        categoria: categoria,
        listaPrecio: precio,
        refreshTrigger, // Nuevo parámetro para forzar recargas
    });

    const clear = useCallback(() => {
        setPage(1);
        setCombinedData([]);
        setHasMore(true);
        if (!categoria) dispatch(clearFilters());
    }, [categoria, dispatch]); // Memoizar y simplificar

    const refreshProducts = useCallback(async () => {
        clear();
        setRefreshTrigger(Date.now()); // Actualizar trigger para nueva recarga
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [clear]);

    // Manejar actualización de datos
    useEffect(() => {
        if (data) {
            const mappedProducts = data.data.map(mapApiProductToAppProduct);
            // ✅ Evitar agregar datos vacíos o duplicados
            if (mappedProducts.length === 0) {
                setHasMore(false);
                return;
            }

            setCombinedData(prev => {
                const newProducts = mappedProducts.filter((p: any) =>
                    !prev.some(existing => existing.id === p.id)
                );
                return page === 1 ? newProducts : [...prev, ...newProducts];
            });

            setHasMore(mappedProducts.length >= PAGE_SIZE);
        }
    }, [data, page]);


    // Recargar cuando cambia la categoría
    useEffect(() => {
        clear();
    }, [categoria]); // Solo depende de categoria

    // Manejo de errores optimizado
    useEffect(() => {
        if (error) {
            console.error("Error fetching products:", error);
            setHasMore(false);
        }
    }, [error]);

    // Cargar más datos
    const loadMore = useCallback(async (event: CustomEvent<void>) => {
        if (!isFetching && hasMore) {
            setPage(prev => prev + 1);
        }
        (event.target as HTMLIonInfiniteScrollElement).complete();
    }, [isFetching, hasMore]);

    return (
        <div className="relative pb-16">
            {/* Encabezado */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90 border-b border-gray-200 dark:border-gray-700">
                <section className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pr-4">
                    <div className="flex items-center gap-2 h-10">
                        {['Favoritos', 'Promociones', 'Recomendados', 'Nuevos'].map((text) => (
                            <Badge key={text} color="purple" text={text} />
                        ))}
                    </div>
                </section>

                <button
                    className="shrink-0 mr-2 inline-flex items-center justify-center font-medium rounded-lg bg-purple-800 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={refreshProducts}
                    disabled={isFetching}
                >
                    Actualizar
                </button>
            </div>

            {/* Lista de productos */}
            <IonList>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <AnimatePresence>
                        {combinedData.map((product, key) => (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </IonList>

            {/* Infinite Scroll */}
            <IonInfiniteScroll
                onIonInfinite={loadMore}
                threshold="100px"
                disabled={!hasMore || isFetching}
            >
                <IonInfiniteScrollContent
                    loadingText="Cargando más productos..."
                    loadingSpinner="bubbles"
                />
            </IonInfiniteScroll>

            {/* Indicador de carga inicial */}
            <AnimatePresence>
                {isFetching && page === 1 && (
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-purple-800 text-white py-3 px-4 flex items-center justify-center z-50 shadow-lg"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="mr-3 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></div>
                        </div>
                        <span>Cargando productos...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ProductGrid