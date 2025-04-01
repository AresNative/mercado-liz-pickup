"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IonInfiniteScroll, IonInfiniteScrollContent, IonList } from "@ionic/react"
import ProductCard from "./product-card"

interface Product {
    id: string
    image?: string
    title: string
    discount?: number
    category: string
    price: number
    originalPrice?: number
}

const ProductGrid: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [showFooterLoading, setShowFooterLoading] = useState(false)

    // Sample products for demonstration
    const sampleProducts: Product[] = [
        {
            id: "1",
            image: "",
            title: "Product 1",
            discount: 20,
            category: "Category A",
            price: 245,
            originalPrice: 300,
        },
        {
            id: "2",
            image: "",
            title: "Product 2",
            discount: 15,
            category: "Category B",
            price: 180,
            originalPrice: 210,
        },
        {
            id: "3",
            image: "",
            title: "Product 3",
            category: "Category C",
            price: 120,
        },
    ]

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
            <div className="flex justify-end p-4">
                <button
                    className="bg-[#7C3AED] text-white px-4 py-2 rounded-md text-sm"
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
                        className="fixed bottom-0 left-0 right-0 bg-[#7C3AED] text-white py-3 px-4 flex items-center justify-center z-50 shadow-lg"
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

