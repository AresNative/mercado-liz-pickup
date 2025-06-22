import React from "react"
import { IonRouterLink } from "@ionic/react"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Barcode } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/selector"
import { addToCart, removeFromCart } from "@/hooks/slices/cart"
import { Product } from "@/utils/data/example-data"

interface ProductCardProps {
    product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const dispatch = useAppDispatch()
    const cartItems = useAppSelector((state) => state.cart.items)
    const cartItem = cartItems.find((item) => item.id === product.id)
    const quantity = cartItem?.quantity || 0

    const handleAddToCart = () => {
        dispatch(addToCart({ ...product, quantity: 1 }))
    }

    const handleIncrement = () => {
        dispatch(addToCart({ ...product, quantity: 1 }))
    }

    const handleDecrement = () => {
        if (quantity === 1) {
            dispatch(removeFromCart(product.id));
        } else {
            dispatch(addToCart({ ...product, quantity: -1 }));
        }
    }

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(e.target.value);
        if (!isNaN(newQuantity)) {
            if (newQuantity <= 0) {
                dispatch(removeFromCart(product.id));
            } else {
                const delta = newQuantity - quantity;
                dispatch(addToCart({
                    ...product,
                    quantity: delta > 0 ? delta : Math.max(delta, -quantity)
                }));
            }
        }
    }

    const hasDiscount = product.precioRegular && product.descuento
    const finalPrice = hasDiscount ? product.precioRegular : product.precio
    const savings = hasDiscount ? (product.precio - (product.precioRegular || 0)).toFixed(2) : 0

    return (
        <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
            <div className="flex flex-row sm:flex-col h-full">
                {/* Sección de imagen */}
                <IonRouterLink
                    routerLink={`/products/${product.nombre}`}
                    className={`relative overflow-hidden ${product.image
                        ? 'w-24 sm:w-full sm:h-48 flex-shrink-0'
                        : 'w-0 sm:w-full sm:h-12'
                        } transition-all duration-300`}
                >
                    {product.image ? (
                        <>
                            <div className="w-full h-full">
                                <img
                                    src={product.image}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-l-2xl sm:rounded-l-none sm:rounded-t-2xl"
                                />
                            </div>
                            {hasDiscount && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                    -{product.descuento}%
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="hidden sm:flex w-full h-12 bg-gradient-to-r from-gray-50 to-gray-100 items-center justify-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    )}
                </IonRouterLink>

                {/* Contenido del producto */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-0">
                    {/* Header del producto */}
                    <div className="flex-1">
                        <IonRouterLink
                            routerLink={`/products/${product.nombre}`}
                            className="text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg p-1 -m-1"
                        >
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-purple-700 transition-colors">
                                {product.nombre}
                            </h3>
                        </IonRouterLink>

                        {/* Metadatos del producto */}
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">4.8</span>
                                </div>
                                <span>•</span>
                                <span className="capitalize">{product.categoria}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{product.unidad}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Barcode className="w-3 h-3" />
                                <span>CB: {product.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer con precio y acciones */}
                    <div className="mt-4 flex items-end justify-between gap-3">
                        {/* Sección de precios */}
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg text-gray-900">
                                    ${finalPrice?.toFixed(2)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through">
                                        ${product.precio.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            {hasDiscount && (
                                <span className="text-xs text-green-600 font-medium">
                                    Ahorras ${savings}
                                </span>
                            )}
                        </div>

                        {/* Controles de cantidad */}
                        <motion.div
                            className="flex-shrink-0"
                            whileTap={{ scale: 0.95 }}
                        >
                            {quantity === 0 ? (
                                <button
                                    onClick={handleAddToCart}
                                    className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95"
                                    aria-label={`Agregar ${product.nombre} al carrito`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                                    <button

                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onClick={handleDecrement}
                                        aria-label="Disminuir cantidad"
                                    >
                                        <span className="text-lg font-medium">−</span>
                                    </button>

                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        className="w-12 h-8 text-center text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md"
                                        min="0"
                                        aria-label="Cantidad"
                                    />

                                    <button
                                        className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onClick={handleIncrement}
                                        aria-label="Aumentar cantidad"
                                    >
                                        <span className="text-lg font-medium">+</span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default ProductCard