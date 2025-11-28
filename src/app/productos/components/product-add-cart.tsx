import { useAppDispatch, useAppSelector } from "@/hooks/selector";
import { Producto } from "@/utils/types/page";
import { cn } from "@/utils/functions/cn";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { addToCart, removeFromCart } from "@/hooks/slices/cart";

interface ButtonProps {
    id: string;
    cantidad: any;
    producto: Producto;
}

const AddToCartButton: React.FC<ButtonProps> = ({ id, cantidad, producto }) => {
    const dispatch = useAppDispatch();
    const cartItem = useAppSelector((state) =>
        state.cart.items.find((item) => item.id === id)
    );

    const quantity = cartItem?.quantity || 0;

    // Stock status - usar la cantidad actualizada
    const isOutOfStock = cantidad <= 0;
    const canAddToCart = !isOutOfStock && quantity < cantidad;

    // Asegurar que las funciones usen los props actualizados
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (cantidad > 0 && quantity < cantidad) {
            dispatch(addToCart({
                ...producto,
                quantity: 1
            }));
        }
    }, [producto, cantidad, quantity, dispatch]);

    const handleIncrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < cantidad) {
            dispatch(addToCart({
                ...producto,
                quantity: 1
            }));
        }
    }, [producto, cantidad, quantity, dispatch]);

    const handleDecrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity > 0) {
            if (quantity === 1) {
                dispatch(removeFromCart(id));
            } else {
                dispatch(addToCart({
                    ...producto,
                    quantity: -1
                }));
            }
        }
    }, [producto, id, quantity, dispatch]);

    // Función para eliminar rápidamente el producto del carrito
    const handleRemoveFromCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(removeFromCart(id));
    }, [id, dispatch]);

    const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(e.target.value) || 0;

        if (newQuantity >= 0 && newQuantity <= cantidad) {
            if (newQuantity === 0) {
                dispatch(removeFromCart(id));
            } else {
                const difference = newQuantity - quantity;
                if (difference !== 0) {
                    dispatch(addToCart({
                        ...producto,
                        quantity: difference
                    }));
                }
            }
        }
    }, [producto, id, cantidad, quantity, dispatch]);

    return (
        <motion.div className="flex items-center gap-2 flex-shrink-0">
            {!isOutOfStock ? (
                quantity === 0 ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToCart}
                        disabled={!canAddToCart}
                        className={cn(
                            "p-2.5 min-w-20 gap-2 flex items-center justify-between rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                            canAddToCart
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                    > Agregar
                        <ShoppingCart className="w-4 h-4" />
                    </motion.button>
                ) : (
                    <motion.div
                        className="flex items-center gap-1 bg-gray-50 rounded-xl p-1"
                        layout
                    >

                        {/* Botón para eliminar rápidamente */}
                        <button
                            onClick={handleRemoveFromCart}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ml-1"
                            aria-label="Eliminar producto del carrito"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
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
                            max={cantidad}
                            disabled
                            aria-label="Cantidad"
                        />

                        <button
                            onClick={handleIncrement}
                            disabled={quantity >= cantidad}
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                                quantity >= cantidad
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
    );
}
export default AddToCartButton;