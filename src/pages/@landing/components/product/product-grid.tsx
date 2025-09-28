// product-grid.tsx - Corrección del infinite scroll
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonInfiniteScroll, IonInfiniteScrollContent, IonList, IonSpinner } from "@ionic/react";
import ProductCard from "./product-card";
import Badge from "@/components/badge";
import { Product } from "@/utils/data/example-data";
import { useGetArticulosMutation } from "@/hooks/reducers/api_int";
import { mapApiProductToAppProduct } from "../../utils/fromat-data";
import { useAppSelector } from "@/hooks/selector";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const PAGE_SIZE = 10;

interface ProductGridProps {
    onProductsLoaded?: (count: number) => void;
    onFavoriteCountChange?: (count: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductsLoaded, onFavoriteCountChange }) => {
    // State management
    const [page, setPage] = useState(1);
    const [products, setProducts] = useState<Product[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Refs
    const currentCategoryRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const infiniteScrollRef = useRef<HTMLIonInfiniteScrollElement>(null);

    // Hooks
    const [getData] = useGetArticulosMutation();
    const categoria = useAppSelector((state) => state.filterData.key?.value);
    const precio = getLocalStorageItem("sucursal")?.precio;

    // Memoized values
    const isFavoritesSection = activeSection === 'Favoritos';
    const isEmpty = products.length === 0;

    // Get favorite products
    const getFavoriteProducts = useCallback((): Product[] => {
        try {
            const favorites = localStorage.getItem('favorites');
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
        const handleStorageChange = () => {
            if (isFavoritesSection) {
                setProducts(getFavoriteProducts());
            }
            setFavoriteCount(getFavoriteProducts().length);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [isFavoritesSection, getFavoriteProducts]);

    // CORREGIDO: Fetch data from API con manejo correcto de paginación
    const fetchData = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
        if (isFavoritesSection) return;

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const loadingState = isLoadMore ? setIsLoadingMore : setIsLoading;
        loadingState(true);

        try {
            const result = await getData({
                page: pageNum,
                pageSize: PAGE_SIZE,
                filtro: {
                    "Filtros": [
                        {
                            "Key": "Precio",
                            "Value": "0",
                            "Operator": ">"
                        }
                    ],
                    "Selects": [
                        { "Key": "cb.Codigo" },
                        { "Key": "cb.Cuenta" },
                        { "Key": "art.Grupo" },
                        { "Key": "art.Descripcion1" },
                        { "Key": "art.Unidad" },
                        { "Key": "lpu.Precio" },
                        { "Key": "au.Unidad" },
                        { "Key": "au.Factor" },
                        { "Key": "inv.TotalInventario" }
                    ],
                    "Order": [
                        {
                            "key": "Codigo",
                            "direction": "desc"
                        }
                    ]
                },
                categoria: categoria,
                listaPrecio: precio,
                signal: abortControllerRef.current.signal,
            });

            if (result.data && Array.isArray(result.data.data)) {
                const mappedProducts = result.data.data.map(mapApiProductToAppProduct);
                const hasMoreData = mappedProducts.length >= PAGE_SIZE;

                if (isLoadMore) {
                    // Para carga adicional: agregar a allProducts y mostrar solo los primeros N
                    setProducts(prev => [...prev, ...mappedProducts]);
                } else {
                    // Para carga inicial: resetear todo
                    setProducts(mappedProducts);
                    setInitialLoadComplete(true);
                }

                setHasMore(hasMoreData);
                setPage(pageNum);
                onProductsLoaded?.(mappedProducts.length);

                // Reset infinite scroll cuando hay nueva data
                if (infiniteScrollRef.current && !hasMoreData) {
                    infiniteScrollRef.current.complete();
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error fetching data:", error);
            }
        } finally {
            loadingState(false);
            abortControllerRef.current = null;
        }
    }, [categoria, precio, isFavoritesSection, getData, onProductsLoaded]);

    // CORREGIDO: Initial load and category changes
    useEffect(() => {
        if (!initialLoadComplete || currentCategoryRef.current !== categoria) {
            currentCategoryRef.current = categoria || null;
            setPage(1);
            setProducts([]);
            setHasMore(true);
            fetchData(1, false);
        }
    }, [categoria, fetchData, initialLoadComplete]);

    // CORREGIDO: Load more data - función simplificada y corregida
    const loadMore = useCallback(async (event: CustomEvent<void>) => {

        if (hasMore && !isFavoritesSection && !isLoadingMore) {
            const nextPage = page + 1;
            await fetchData(nextPage, true);
        }

        // Siempre completar el infinite scroll
        const infiniteScroll = event.target as HTMLIonInfiniteScrollElement;
        infiniteScroll.complete();

        // Deshabilitar si no hay más datos
        if (!hasMore) {
            infiniteScroll.disabled = true;
        }
    }, [hasMore, isFavoritesSection, isLoadingMore, page, fetchData]);

    // Section change handler
    const handleSectionChange = useCallback((section: string) => {
        const newSection = activeSection === section ? null : section;
        setActiveSection(newSection);

        if (newSection === 'Favoritos') {
            setProducts(getFavoriteProducts());
        } else {
            // Resetear para cargar desde el inicio
            setPage(1);
            setProducts([]);
            setHasMore(true);
            fetchData(1, false);
        }
    }, [activeSection, getFavoriteProducts, fetchData]);

    // Reset data
    const resetData = useCallback(() => {
        setPage(1);
        setProducts([]);
        setHasMore(true);
        setInitialLoadComplete(false);
        if (!isFavoritesSection) {
            fetchData(1, false);
        }

        // Reset infinite scroll
        if (infiniteScrollRef.current) {
            infiniteScrollRef.current.disabled = false;
        }
    }, [isFavoritesSection, fetchData]);

    // Handle favorite toggle from product cards
    const handleFavoriteToggle = useCallback((productId: string, isFavorite: boolean) => {
        if (isFavoritesSection) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
        setFavoriteCount(prev => isFavorite ? prev + 1 : prev - 1);
        onFavoriteCountChange?.(favoriteCount + (isFavorite ? 1 : -1));
    }, [isFavoritesSection, favoriteCount, onFavoriteCountChange]);

    // Memoized product list
    const productList = useMemo(() => (
        <motion.div
            key={activeSection || 'all'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <AnimatePresence mode="popLayout">
                {products.map((product, index) => (
                    <motion.div
                        key={`${product.id}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                        <ProductCard
                            product={product}
                            onFavoriteToggle={handleFavoriteToggle}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    ), [products, loadMore, activeSection, handleFavoriteToggle]);

    // Empty state
    const emptyState = useMemo(() => (
        <div className="mt-20 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-100 rounded-full p-6 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {isFavoritesSection ? 'Sin favoritos' : 'No hay productos'}
            </h1>
            <p className="text-gray-600 mb-6 max-w-md">
                {isFavoritesSection
                    ? 'Agrega productos a tus favoritos para verlos aquí.'
                    : 'No se encontraron productos para esta categoría. Intenta con otros filtros.'}
            </p>
        </div>
    ), [isFavoritesSection]);

    return (
        <div className="relative pb-16">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                <section className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                        { key: null, label: "Todos", count: products.length },
                        { key: 'Favoritos', label: "Favoritos", count: favoriteCount }
                    ].map((section) => (
                        <button
                            key={section.key || 'all'}
                            onClick={() => handleSectionChange(section.key!)}
                            className="flex items-center gap-2 h-10 cursor-pointer focus:outline-none"
                        >
                            <Badge
                                color={activeSection === section.key ? "purple" : "gray"}
                                text={`${section.label} ${section.count > 0 ? `(${section.count})` : ''}`}
                            />
                        </button>
                    ))}
                </section>

                <button
                    onClick={resetData}
                    disabled={isLoading}
                    className="shrink-0 inline-flex items-center justify-center font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <IonSpinner className="w-4 h-4" /> : 'Actualizar'}
                </button>
            </div>

            {/* Product List */}
            <IonList className="min-h-[400px]">
                {isEmpty && !isLoading ? (
                    emptyState
                ) : (
                    productList
                )}
            </IonList>

            {/* CORREGIDO: Infinite Scroll con ref y manejo correcto */}
            {!isFavoritesSection && (
                <IonInfiniteScroll
                    ref={infiniteScrollRef}
                    onIonInfinite={loadMore}
                    threshold="100px"
                /* disabled={!hasMore || isLoadingMore} */
                >
                    <IonInfiniteScrollContent />
                </IonInfiniteScroll>
            )}
            {/* Loading Indicators */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
                            <IonSpinner className="w-6 h-6 text-purple-600" />
                            <span className="text-gray-700">Cargando productos...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading More Indicator */}
            {isLoadingMore && (
                <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <IonSpinner className="w-5 h-5 text-purple-600" />
                        <span>Cargando más productos...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ProductGrid);