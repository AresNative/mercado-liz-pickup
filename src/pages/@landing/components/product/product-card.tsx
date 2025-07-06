import React, { useEffect, useState } from "react";
import { IonRouterLink } from "@ionic/react";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Barcode, Hash, Heart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { addToCart, removeFromCart } from "@/hooks/slices/cart";
import { Product } from "@/utils/data/example-data";
import { cn } from "@/utils/functions/cn";

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) => state.cart.items);
    const cartItem = cartItems.find((item) => item.id === product.id);
    const quantity = cartItem?.quantity || 0;
    const [isFavorite, setIsFavorite] = useState(false); // Estado para favorito

    // Verificar si el producto es favorito al cargar
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.some((fav: Product) => fav.id === product.id));
    }, [product.id]);

    // Función para alternar favoritos
    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        let newFavorites;

        if (isFavorite) {
            newFavorites = favorites.filter((fav: Product) => fav.id !== product.id);
        } else {
            newFavorites = [...favorites, product];
        }

        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        setIsFavorite(!isFavorite);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(addToCart({ ...product, quantity: 1 }));
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < product.cantidad) {
            dispatch(addToCart({ ...product, quantity: 1 }));
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity === 1) {
            dispatch(removeFromCart(product.id));
        } else {
            dispatch(addToCart({ ...product, quantity: -1 }));
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(e.target.value);
        if (!isNaN(newQuantity)) {
            // Limitar la cantidad al stock disponible
            const clampedQuantity = Math.min(Math.max(newQuantity, 0), product.cantidad);

            if (clampedQuantity === 0) {
                dispatch(removeFromCart(product.id));
            } else {
                const delta = clampedQuantity - quantity;
                dispatch(addToCart({
                    ...product,
                    quantity: delta
                }));
            }
        }
    }

    // Corrección en el cálculo de descuento
    const hasDiscount = product.descuento && product.descuento > 0;
    const finalPrice = hasDiscount ? product.precioRegular : product.precio;
    const savings = hasDiscount ? (product.precio - (product.precioRegular || 0)).toFixed(2) : 0

    return (
        <article className="products group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
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
                            className="text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <h3 className="font-semibold m-0 text-gray-900 text-sm sm:text-base group-hover:text-purple-700 transition-colors">
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
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Hash className="w-3 h-3" />
                                <span>Pz disponible(s): {product.cantidad}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer con precio y acciones */}
                    <div className="mt-4 flex items-end justify-between gap-3">
                        {/* Sección de precios */}
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                {finalPrice && (
                                    <span className="font-bold text-lg text-gray-900">
                                        ${finalPrice.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>)}
                                {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through">
                                        ${product.precio.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
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
                            className="flex items-center flex-shrink-0"
                            whileTap={{ scale: 0.95 }}
                        >

                            {/* Botón de favoritos */}
                            <button
                                onClick={toggleFavorite}
                                className="top-2 right-2 p-1.5 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                                <Heart
                                    className={cn(
                                        "w-6 h-6 transition-colors",
                                        isFavorite
                                            ? "fill-red-400 text-red-500"
                                            : "text-gray-300 hover:text-red-400"
                                    )}
                                />
                            </button>
                            {product.cantidad > 0 ? (
                                quantity === 0 ? (
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
                                            max={product.cantidad}
                                            aria-label="Cantidad"
                                        />

                                        <button
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                                                quantity >= product.cantidad
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                                            )}
                                            onClick={handleIncrement}
                                            disabled={quantity >= product.cantidad}
                                            aria-label="Aumentar cantidad"
                                        >
                                            <span className="text-lg font-medium">+</span>
                                        </button>
                                    </div>
                                )
                            ) : (
                                <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 p-2.5 rounded-xl shadow-md cursor-not-allowed"
                                >
                                    No disponible
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default ProductCard;