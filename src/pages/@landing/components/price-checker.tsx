import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList } from "@ionic/react"
import useDebounce from "@/hooks/use-debounce"
import { useGetArticulosQuery } from "@/hooks/reducers/api"
import { Search } from "lucide-react"
import { useAppDispatch } from "@/hooks/selector"; // Añadir import
import { Product } from "@/utils/data/example-data"

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`w-full px-3 py-2 border text-gray-500 dark:text-gray-100 border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 ${className}`}
            {...props}
        />
    )
}

const PAGE_SIZE = 5

function PriceChecker() {
    const [page, setPage] = useState(1)
    const [combinedData, setCombinedData] = useState<Product[]>([])
    const [hasMore, setHasMore] = useState(true)
    const [query, setQuery] = useState("")
    const debouncedQuery = useDebounce(query, 200)

    const { data, isFetching, error } = useGetArticulosQuery({
        page,
        pageSize: PAGE_SIZE,
        filtro: query ?? null,
        listaPrecio: "(Precio Lista)",
        debouncedQuery
    })

    const [isFocused, setIsFocused] = useState(false)
    // Manejar actualización de datos
    useEffect(() => {
        if (data) {
            const mappedProducts = data.data.map((item: any) => ({
                id: item.ID,
                title: item.Nombre,  // Cambiar de name a title
                price: item.PrecioRegular,
                category: item.Grupo,
                unidad: item.Unidad, // Cambiar description por unidad
                image: item.Imagen || "/placeholder.svg", // Añadir imagen
            }))

            setCombinedData(prev =>
                page === 1 ? mappedProducts : [...prev, ...mappedProducts]
            )
            setHasMore(mappedProducts.length === PAGE_SIZE)
        }
    }, [data, page])

    // Resetear datos cuando cambia el query
    useEffect(() => {
        setPage(1)
        setCombinedData([])
    }, [debouncedQuery])

    // Manejo de errores
    useEffect(() => {
        if (error) {
            console.error("Error fetching products:", error)
            setHasMore(false)
        }
    }, [error])

    const loadMore = useCallback(async (event: CustomEvent<void>) => {
        if (!isFetching && hasMore) {
            setPage(prev => prev + 1)
        }
        (event.target as HTMLIonInfiniteScrollElement).complete()
    }, [isFetching, hasMore])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
    }

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.4 },
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.2 },
            },
        },
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    }

    return (
        <div className="mx-auto inset-0 z-20">
            <div className="relative flex max-h-3/4  flex-col justify-start items-center">
                <div className="bg-background w-full sticky">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Buscar productos..."
                            value={query}
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="pl-3 pr-9 text-sm rounded-lg bg-white"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm absolute top-10 inset-0 mx-auto z-10 mt-2">
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                className="w-full max-h-[500px] overflow-y-auto border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900"
                                variants={container}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                            >
                                <motion.ul>
                                    {combinedData.map((product, key) => (
                                        <motion.li
                                            key={key}
                                            className="px-3 py-2 flex items-center justify-between cursor-pointer rounded-md"
                                            variants={item}
                                            layout
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}>
                                            <div className="p-0 m-0 w-full h-full">
                                                <IonList className="flex items-center gap-2 justify-between flex-1">
                                                    <IonItem className="w-full flex items-center gap-2" routerLink={`/products/${product.id}`}>

                                                        {product.image && ( // Mostrar imagen si existe
                                                            <img
                                                                src={product.image}
                                                                alt={product.title}
                                                                className="h-8 w-8 rounded-md object-cover md:block hidden"
                                                            />
                                                        )}
                                                        <section className="flex flex-col">
                                                            <IonLabel className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {product.title}
                                                            </IonLabel>
                                                            <span className="text-xs text-gray-400">
                                                                {product.unidad} {/* Cambiar de description a unidad */}
                                                            </span>
                                                        </section>
                                                    </IonItem>
                                                </IonList>
                                            </div>
                                        </motion.li>
                                    ))}

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
                                </motion.ul>

                                <div className="bottom-0 mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Resultados: {combinedData.length}</span>
                                        <span>ESC para cancelar</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default PriceChecker