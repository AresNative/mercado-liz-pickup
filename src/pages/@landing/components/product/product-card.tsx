// product-card.tsx - Corrección del estado del carrito
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { IonRouterLink } from "@ionic/react";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Barcode, Hash, Heart, Truck, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { addToCart, removeFromCart } from "@/hooks/slices/cart";
import { Product } from "@/utils/data/example-data";
import { cn } from "@/utils/functions/cn";

interface ProductCardProps {
    product: Product;
    onFavoriteToggle?: (productId: string, isFavorite: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onFavoriteToggle }) => {
    const dispatch = useAppDispatch();

    // Obtener el estado actual del carrito correctamente
    const cartItem = useAppSelector((state) =>
        state.cart.items.find((item) => item.id === product.id)
    );

    const quantity = cartItem?.quantity || 0;
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Favorite management
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.some((fav: Product) => fav.id === product.id));
    }, [product.id]);

    const toggleFavorite = useCallback((e: React.MouseEvent) => {
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
        onFavoriteToggle?.(product.id, !isFavorite);
    }, [isFavorite, product, onFavoriteToggle]);

    // CORREGIDO: Manejo correcto del carrito
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (product?.cantidad > 0) {
            // Siempre agregar 1 unidad, no depende del quantity actual
            dispatch(addToCart({
                ...product,
                quantity: 1
            }));
        }
    }, [product, dispatch]);

    const handleIncrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < product.cantidad) {
            // Agregar 1 unidad más
            dispatch(addToCart({
                ...product,
                quantity: 1
            }));
        }
    }, [product, quantity, dispatch]);

    const handleDecrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity > 0) {
            if (quantity === 1) {
                dispatch(removeFromCart(product.id));
            } else {
                // Restar 1 unidad (usando quantity negativo)
                dispatch(addToCart({
                    ...product,
                    quantity: -1
                }));
            }
        }
    }, [product, quantity, dispatch]);

    const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(e.target.value) || 0;

        if (newQuantity >= 0 && newQuantity <= product.cantidad) {
            if (newQuantity === 0) {
                dispatch(removeFromCart(product.id));
            } else {
                // Calcular la diferencia y enviar esa cantidad
                const difference = newQuantity - quantity;
                if (difference !== 0) {
                    dispatch(addToCart({
                        ...product,
                        quantity: difference
                    }));
                }
            }
        }
    }, [product, quantity, dispatch]);

    // Price calculations
    const { hasDiscount, finalPrice, savings, discountPercentage } = useMemo(() => {
        const hasDiscount = product.descuento && product.descuento > 0;
        const finalPrice = hasDiscount ? (product.precioRegular || product.precio) : product.precio;
        const savings = hasDiscount ? (product.precio - finalPrice) : 0;
        const discountPercentage = product.descuento || 0;

        return { hasDiscount, finalPrice, savings, discountPercentage };
    }, [product.precio, product.precioRegular, product.descuento]);

    // Stock status
    const isOutOfStock = product.cantidad <= 0;
    const isLowStock = product.cantidad > 0 && product.cantidad <= 10;
    const canAddToCart = !isOutOfStock && quantity < product.cantidad;

    // Image handlers
    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        setImageError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setImageLoaded(false);
        setImageError(true);
    }, []);

    return (
        <motion.article
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden h-full"
        >
            <div className="flex flex-row sm:flex-col h-full">
                {/* Image Section */}
                <IonRouterLink
                    routerLink={`/products/${product.id}`}
                    className={cn(
                        "relative overflow-hidden flex-shrink-0 transition-all duration-300",
                        product.image ? 'w-24 sm:w-full sm:h-48' : 'w-0 sm:w-full sm:h-12'
                    )}
                >
                    {product.image ? (
                        <>
                            <div className="w-full h-full relative">
                                {!imageLoaded && !imageError && (
                                    <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                <img
                                    src={product.image}
                                    alt={product.nombre}
                                    className={cn(
                                        "w-full h-full object-cover transition-transform duration-300",
                                        imageLoaded ? 'group-hover:scale-105' : 'opacity-0',
                                        "rounded-l-2xl sm:rounded-l-none sm:rounded-t-2xl"
                                    )}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                                {imageError && (
                                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {hasDiscount && (
                                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                        -{discountPercentage}%
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                        Últimas {product.cantidad}
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                        Agotado
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>

                            {/* Favorite Button */}
                            <button
                                onClick={toggleFavorite}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full backdrop-blur-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                                <Heart
                                    className={cn(
                                        "w-4 h-4 transition-all duration-200",
                                        isFavorite
                                            ? "fill-red-500 text-red-500 scale-110"
                                            : "text-gray-400 hover:text-red-400 hover:scale-110"
                                    )}
                                />
                            </button>
                            <div className="hidden sm:flex w-full h-12 bg-gradient-to-r from-gray-50 to-gray-100 items-center justify-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                                </div>
                            </div></>
                    )}
                </IonRouterLink>

                {/* Content Section */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-0">
                    {/* Product Info */}
                    <div className="flex-1">
                        <IonRouterLink
                            routerLink={`/products/${product.id}`}
                            className="block text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                        >
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-purple-700 transition-colors mb-2">
                                {product.nombre}
                            </h3>
                        </IonRouterLink>

                        {/* Product Metadata */}
                        <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">4.8</span>
                                </div>
                                <span className="capitalize">{product.categoria}</span>
                                <span>{product.unidad}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Barcode className="w-3 h-3" />
                                <span>CB: {product.id}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                <span>Stock: {product.cantidad} {product.unidad.toLowerCase()}</span>
                            </div>

                            {product.unidad === "Caja" && product.factor && (
                                <div className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    <span>{product.factor} pieza(s) por caja</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="mt-4 flex items-end justify-between gap-3">
                        {/* Price Section */}
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg text-gray-900 truncate">
                                    ${finalPrice.toLocaleString('es-MX', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                                {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through flex-shrink-0">
                                        ${product.precio.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                )}
                            </div>
                            {hasDiscount && (
                                <span className="text-xs text-green-600 font-medium">
                                    Ahorras ${savings.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Cart Controls */}
                        <motion.div className="flex items-center gap-2 flex-shrink-0">
                            {!isOutOfStock ? (
                                quantity === 0 ? (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAddToCart}
                                        disabled={!canAddToCart}
                                        className={cn(
                                            "p-2.5 rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                                            canAddToCart
                                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        )}
                                        aria-label={`Agregar ${product.nombre} al carrito`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        className="flex items-center gap-1 bg-gray-50 rounded-xl p-1"
                                        layout
                                    >
                                        <button
                                            onClick={handleDecrement}
                                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                            onClick={handleIncrement}
                                            disabled={quantity >= product.cantidad}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                                                quantity >= product.cantidad
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                                            )}
                                            aria-label="Aumentar cantidad"
                                        >
                                            <span className="text-lg font-medium">+</span>
                                        </button>
                                    </motion.div>
                                )
                            ) : (
                                <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 px-3 py-2 rounded-xl text-xs font-medium cursor-not-allowed"
                                >
                                    Agotado
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.article>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;