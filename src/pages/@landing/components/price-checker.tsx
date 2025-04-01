"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Tag, DollarSign } from "lucide-react"
import useDebounce from "@/hooks/use-debounce"
import { fetchDynamicData } from "@/api/get-data"

interface Product {
    id: string
    name: string
    price: number
    category: string
    icon: React.ReactNode
    description?: string
}

interface ListingItem extends Product {
    quantity: number
}

interface formatFilter {
    key: string;
    value: string;
    operator: "like" | "=" | ">=" | "<=" | ">" | "<" | "<>" | ""; // Incluí "" como opción para el operador.
}

interface formatSuma {
    key: string;
}
interface formatLoadDate {
    filters: {
        filtros: formatFilter[];
        sumas: formatSuma[];
    };
    page: number;
    sum: boolean;
}

// Componentes maquetados con Tailwind
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:text-gray-100 ${className}`}
            {...props}
        />
    )
}

const allProducts: Product[] = [
    {
        id: "1",
        name: "Laptop HP Pavilion",
        price: 899.99,
        category: "Electrónicos",
        icon: <DollarSign className="h-4 w-4 text-blue-500" />,
        description: "Intel Core i7, 16GB RAM, 512GB SSD",
    },
    {
        id: "2",
        name: "Smartphone Samsung Galaxy",
        price: 699.99,
        category: "Electrónicos",
        icon: <DollarSign className="h-4 w-4 text-green-500" />,
        description: "6.7 pulgadas, 128GB, 8GB RAM",
    },
    {
        id: "3",
        name: "Auriculares Sony WH-1000XM4",
        price: 349.99,
        category: "Audio",
        icon: <DollarSign className="h-4 w-4 text-purple-500" />,
        description: "Cancelación de ruido, Bluetooth",
    },
    {
        id: "4",
        name: "Monitor LG UltraGear",
        price: 299.99,
        category: "Periféricos",
        icon: <DollarSign className="h-4 w-4 text-orange-500" />,
        description: "27 pulgadas, 144Hz, 1ms",
    },
    {
        id: "5",
        name: "Teclado Mecánico Logitech",
        price: 129.99,
        category: "Periféricos",
        icon: <DollarSign className="h-4 w-4 text-red-500" />,
        description: "RGB, Switches Blue",
    },
]

function PriceChecker() {
    const [query, setQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Product[]>(allProducts)
    const [isFocused, setIsFocused] = useState(false)
    const [listing, setListing] = useState<ListingItem[]>([])
    const [isCreatingListing, setIsCreatingListing] = useState(false)
    const [listingTitle, setListingTitle] = useState("")
    const debouncedQuery = useDebounce(query, 200)

    const [data, setData] = useState<Record<string, any>[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const loadData = async (filter: formatLoadDate, endpoint: string) => {
        try {
            const { data: resultData, totalPages: pages } = await fetchDynamicData<any>(filter, endpoint);
            setData(resultData);
            setTotalPages(pages);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const columns = useMemo(() => data[0] ? Object.keys(data[0]) : [], [data]);

    useEffect(() => {
        loadData({
            filters: {
                filtros: [{ key: "", value: "", operator: "" }],
                sumas: [{ key: "Categoria" }],
            },
            page: currentPage,
            sum: false
        }, 'v2/select/combos');
    }, [currentPage]);


    useEffect(() => {
        if (!isFocused) {
            return
        }

        if (!debouncedQuery) {
            setSearchResults(allProducts)
            return
        }

        const normalizedQuery = debouncedQuery.toLowerCase().trim()
        const filteredProducts = allProducts.filter((product) => {
            const searchableText = `${product.name} ${product.category} ${product.description}`.toLowerCase()
            return searchableText.includes(normalizedQuery)
        })

        setSearchResults(filteredProducts)
    }, [debouncedQuery, isFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
    }

    const addToListing = (product: Product) => {
        setListing((prevListing) => {
            const existingItem = prevListing.find((item) => item.id === product.id)

            if (existingItem) {
                return prevListing.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
            } else {
                return [...prevListing, { ...product, quantity: 1 }]
            }
        })
    }

    const calculateTotal = () => {
        return listing.reduce((total, item) => total + item.price * item.quantity, 0)
    }

    const saveListing = () => {
        // Aquí se implementaría la lógica para guardar el listado
        console.log("Listado guardado:", {
            title: listingTitle || "Listado sin título",
            items: listing,
            total: calculateTotal(),
        })

        // Reiniciar el formulario
        setListing([])
        setListingTitle("")
        setIsCreatingListing(false)
    }

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: {
                    duration: 0.4,
                },
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: {
                    duration: 0.3,
                },
                opacity: {
                    duration: 0.2,
                },
            },
        },
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
            },
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: {
                duration: 0.2,
            },
        },
    }

    return (
        <div className="w-11/12 mx-auto inset-0 z-20">
            <div className="relative flex flex-col justify-start items-center">
                <div className="bg-background w-full sticky">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Buscar productos..."
                            value={query}
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            className="pl-3 pr-9 text-sm rounded-lg bg-white"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-sm absolute top-10 left-0 z-10 mt-2">
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                className="w-full border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900 "
                                variants={container}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                            >
                                <motion.ul>
                                    {searchResults.map((product) => (
                                        <motion.li
                                            key={product.id}
                                            className="px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-md"
                                            variants={item}
                                            layout
                                        >
                                            <div className="flex items-center gap-2 justify-between flex-1" onClick={() => addToListing(product)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">{product.icon}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {product.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{product.description}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                        ${product.price.toFixed(2)}
                                                    </span>
                                                    <button
                                                        className="h-7 w-7 p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                        onClick={() => addToListing(product)}
                                                    >
                                                        <Plus className="h-4 w-4 text-gray-300 dark:text-gray-50" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                                <div className="mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Resultados: {searchResults.length}</span>
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
