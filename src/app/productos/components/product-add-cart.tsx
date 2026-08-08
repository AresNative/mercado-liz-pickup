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

    // Determinar si la unidad es kg
    const isKgUnit = producto?.unidad?.toLowerCase().includes('kg') || producto?.unidad?.toLowerCase().includes('kilogramo');

    // Step para incrementos/decrementos
    const step = isKgUnit ? 0.25 : 1;

    // Función para redondear a múltiplos de step
    const roundToStep = (value: number, step: number) => {
        return Math.round(value / step) * step;
    };

    // Stock status - usar la cantidad actualizada
    const isOutOfStock = cantidad <= 0;
    const canAddToCart = !isOutOfStock && quantity < cantidad;

    // Función para agregar al carrito con step
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (cantidad > 0 && quantity < cantidad) {
            dispatch(addToCart({
                ...producto,
                quantity: step
            }));
        }
    }, [producto, cantidad, quantity, dispatch, step]);

    const handleIncrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newQuantity = roundToStep(quantity + step, step);
        if (newQuantity <= cantidad) {
            const difference = newQuantity - quantity;
            if (difference > 0) {
                dispatch(addToCart({
                    ...producto,
                    quantity: difference
                }));
            }
        }
    }, [producto, cantidad, quantity, dispatch, step]);

    const handleDecrement = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newQuantity = roundToStep(quantity - step, step);
        if (newQuantity >= 0) {
            if (newQuantity === 0) {
                dispatch(removeFromCart(id));
            } else {
                const difference = newQuantity - quantity;
                if (difference < 0) {
                    dispatch(addToCart({
                        ...producto,
                        quantity: difference
                    }));
                }
            }
        }
    }, [producto, id, quantity, dispatch, step]);

    // Función para eliminar rápidamente el producto del carrito
    const handleRemoveFromCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(removeFromCart(id));
    }, [id, dispatch]);

    const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let newQuantity = parseFloat(e.target.value);

        if (isNaN(newQuantity)) {
            newQuantity = 0;
        }

        // Redondear al step más cercano
        newQuantity = roundToStep(newQuantity, step);

        // Asegurar que no exceda los límites
        newQuantity = Math.max(0, Math.min(newQuantity, cantidad));

        if (newQuantity === 0) {
            dispatch(removeFromCart(id));
        } else if (newQuantity !== quantity) {
            const difference = newQuantity - quantity;
            dispatch(addToCart({
                ...producto,
                quantity: difference
            }));
        }
    }, [producto, id, cantidad, quantity, dispatch, step]);

    // Formatear la cantidad mostrada
    const displayQuantity = isKgUnit ? quantity.toFixed(2) : Math.floor(quantity);

    // Verificar si el botón de incremento debe estar deshabilitado
    const isIncrementDisabled = roundToStep(quantity + step, step) > cantidad;

    return (
        <motion.div className="flex items-center gap-2 flex-shrink-0">
            {!isOutOfStock ? (
                quantity === 0 ? (
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={handleAddToCart}
                        disabled={!canAddToCart}
                        className={cn(
                            "p-2.5 min-w-10 gap-2 text-xs md:text-base flex items-center justify-between rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
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
                            className="md:size-8 size-4 cursor-pointer rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ml-1"
                            aria-label="Eliminar producto del carrito"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleDecrement}
                            className="md:size-8 size-4 cursor-pointer rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Disminuir cantidad"
                        >
                            <span className="text-lg font-medium">−</span>
                        </button>

                        <input
                            type={isKgUnit ? "number" : "text"}
                            value={displayQuantity}
                            onChange={handleQuantityChange}
                            className="w-16 h-8 text-center text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md"
                            min="0"
                            max={cantidad}
                            step={step}
                            aria-label="Cantidad"
                            readOnly={!isKgUnit}
                        />

                        <button
                            onClick={handleIncrement}
                            disabled={isIncrementDisabled}
                            className={cn(
                                "md:size-8 size-4 cursor-pointer rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                                isIncrementDisabled
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