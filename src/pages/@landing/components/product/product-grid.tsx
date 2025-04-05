

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IonInfiniteScroll, IonInfiniteScrollContent, IonList } from "@ionic/react"
import ProductCard from "./product-card"
import Badge from "@/components/badge"
import { Product, sampleProducts } from "@/utils/data/example-data"

const ProductGrid: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [showFooterLoading, setShowFooterLoading] = useState(false)

    // Function to fetch initial products
    useEffect(() => {
        // Show loading on initial fetch
        setShowFooterLoading(true)

        // Simulate initial API call
        setTimeout(() => {
            setProducts(sampleProducts)
            setShowFooterLoading(false)
        }, 1500)
    }, [])

    // Function to load more products
    const loadMoreProducts = async () => {
        if (isLoading || !hasMore) return

        setIsLoading(true)

        // Simulate API call with timeout
        setTimeout(() => {
            // Generate new products based on the current page
            const newProducts = sampleProducts.map((product, index) => ({
                ...product,
                id: `${page}-${index}`,
                title: `${product.title} (Page ${page})`,
            }))

            setProducts((prevProducts) => [...prevProducts, ...newProducts])
            setPage((prevPage) => prevPage + 1)

            // After 3 pages, set hasMore to false to stop infinite loading
            if (page >= 3) {
                setHasMore(false)
            }

            setIsLoading(false)
        }, 1000)
    }

    // Handle infinite scroll event
    const handleInfiniteScroll = (event: any) => {
        loadMoreProducts().then(() => {
            // Complete the infinite scroll event
            event.target.complete()

            // Disable the infinite scroll if there are no more items
            if (!hasMore) {
                event.target.disabled = true
            }
        })
    }

    // Function to manually trigger a refresh with loading indicator
    const refreshProducts = () => {
        setShowFooterLoading(true)
        setPage(1)
        setHasMore(true)

        // Simulate API call
        setTimeout(() => {
            setProducts(sampleProducts)
            setShowFooterLoading(false)
        }, 1500)
    }

    return (
        <div className="relative pb-16">
            {/* Button to manually trigger refresh with loading */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90 border-b border-gray-200 dark:border-gray-700">
                <section className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pr-4">
                    <div className="flex items-center gap-2 h-10">
                        <Badge
                            color="purple"
                            text="Favoritos"
                        />
                        <Badge
                            color="purple"
                            text="Promociones"
                        />
                        <Badge
                            color="purple"
                            text="Recomendados"
                        />
                        <Badge
                            color="purple"
                            text="Nuevos"
                        />
                    </div>
                </section>

                <button
                    className="shrink-0 inline-flex items-center justify-center font-medium rounded-lg bg-purple-800 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={refreshProducts}
                    disabled={showFooterLoading}
                >
                    Actualizar productos
                </button>
            </div>

            <IonList>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>
            </IonList>

            <IonInfiniteScroll
                onIonInfinite={handleInfiniteScroll}
                threshold="100px"
                disabled={!hasMore || showFooterLoading}
            >
                <IonInfiniteScrollContent loadingText="Please wait..." loadingSpinner="bubbles" />
            </IonInfiniteScroll>

            {/* Custom Footer Loading Indicator with CSS spinner instead of IonSpinner */}
            <AnimatePresence>
                {showFooterLoading && (
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

