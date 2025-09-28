import { IonPage, IonContent } from "@ionic/react";
import HeaderCart from "../@landing/components/header";
import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { removeFromCart, updateQuantity, clearCart } from "@/hooks/slices/cart";
import { Calendar, Trash, Minus, Plus } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import ModalCita from "./components/modal-cita";

interface CartItem {
    id: string | number;
    nombre: string;
    categoria: string;
    precio: number;
    precioRegular?: number;
    descuento?: number;
    quantity: number;
    image?: string;
    unidad: string;
}

interface CartItemWithDiscount extends CartItem {
    hasDiscount: boolean;
    finalPrice: number;
    savings: number;
}

const CarritoPage = () => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) =>
        state.cart.items.filter((item: any) => item.quantity > 0)
    );

    // Memoizar cálculos para mejor rendimiento
    const cartItemsWithDiscount = useMemo((): CartItemWithDiscount[] =>
        cartItems.map((item: any) => {
            const hasDiscount = !!(item.precioRegular && item.descuento);
            const finalPrice = hasDiscount ? item.precioRegular! : item.precio;
            const savings = hasDiscount ? (item.precio - finalPrice) * item.quantity : 0;

            return {
                ...item,
                hasDiscount,
                finalPrice,
                savings: Number(savings.toFixed(2))
            };
        }), [cartItems]
    );

    // Memoizar cálculos de totales
    const { subtotal, discountTotal, total } = useMemo(() => {
        const subtotal = cartItemsWithDiscount.reduce(
            (acc, item) => acc + (item.precioRegular || item.precio) * item.quantity, 0
        );

        const discountTotal = cartItemsWithDiscount.reduce(
            (acc, item) => item.hasDiscount
                ? acc + ((item.precio - item.finalPrice) * item.quantity)
                : acc, 0
        );

        const total = subtotal - discountTotal;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            discountTotal: Number(discountTotal.toFixed(2)),
            total: Number(total.toFixed(2))
        };
    }, [cartItemsWithDiscount]);

    const handleQuantityChange = (
        id: string | number,
        currentQuantity: number,
        operation: 'increase' | 'decrease'
    ) => {
        const newQuantity = operation === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

        if (newQuantity < 1) {
            dispatch(removeFromCart(id));
        } else {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        }
    };

    const [showModal, setShowModal] = useState(false);
    const modal = useRef<HTMLIonModalElement>(null);

    const formatCurrency = (amount: number): string => {
        return amount.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Estado vacío del carrito
    if (cartItems.length === 0) {
        return (
            <IonPage>
                <HeaderCart back />
                <IonContent role="feed" fullscreen className="relative bg-gray-50">
                    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-gray-100 rounded-full p-6 mb-6">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Carrito de Compras
                        </h1>
                        <p className="text-gray-600 mb-6">Tu carrito está vacío.</p>
                        <a
                            href="/"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:shadow-md transition-all"
                        >
                            Explorar productos
                        </a>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Estado con productos en el carrito
    return (
        <IonPage>
            <HeaderCart back />
            <IonContent role="feed" fullscreen className="relative bg-gray-50">
                <div className="flex flex-col h-full mb-64">
                    <ModalCita
                        modal={modal}
                        setShowModal={setShowModal}
                        showModal={showModal}
                    />

                    <div className="max-w-4xl mx-auto w-full px-4">
                        <div className="pt-6 pb-4">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                Carrito de Compras
                            </h1>
                            <p className="text-gray-600">
                                Tienes{" "}
                                <span className="font-medium text-purple-700">
                                    {cartItems.length}
                                </span>{" "}
                                {cartItems.length === 1 ? 'producto' : 'productos'} en tu carrito
                            </p>
                        </div>

                        {/* Listado de productos */}
                        <div className="grid grid-cols-1 gap-4 md:mb-6 mb-80">
                            {cartItemsWithDiscount.map((item) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    onRemove={() => dispatch(removeFromCart(item.id))}
                                    onQuantityChange={handleQuantityChange}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sección de totales fija */}
                    <CartTotals
                        subtotal={subtotal}
                        discountTotal={discountTotal}
                        total={total}
                        onClearCart={() => dispatch(clearCart())}
                        onSchedule={() => setShowModal(true)}
                        formatCurrency={formatCurrency}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

// Componente para tarjeta de producto
interface CartItemCardProps {
    item: CartItemWithDiscount;
    onRemove: () => void;
    onQuantityChange: (id: string | number, currentQuantity: number, operation: 'increase' | 'decrease') => void;
}

const CartItemCard = ({ item, onRemove, onQuantityChange }: CartItemCardProps) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
            {item.image && (
                <div className="bg-gray-100 rounded-xl flex items-center justify-center sm:w-24 w-full h-24 flex-shrink-0">
                    <img
                        src={item.image}
                        alt={item.nombre}
                        className="w-full h-full object-contain"
                    />
                </div>
            )}
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {item.nombre}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 capitalize">
                            {item.categoria}
                        </p>
                    </div>
                    <button
                        onClick={onRemove}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        aria-label={`Eliminar ${item.nombre}`}
                    >
                        <Trash className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-gray-900">
                                ${formatCurrency(item.finalPrice)}
                            </span>
                            {item.hasDiscount && (
                                <span className="text-sm text-gray-400 line-through">
                                    ${formatCurrency(item.precio)}
                                </span>
                            )}
                        </div>
                        {item.hasDiscount && (
                            <span className="text-xs text-green-600 mt-1">
                                Ahorras ${formatCurrency(item.savings)}
                            </span>
                        )}
                        <span className="text-xs text-gray-500 mt-1">{item.unidad}</span>
                    </div>

                    <QuantitySelector
                        quantity={item.quantity}
                        onDecrease={() => onQuantityChange(item.id, item.quantity, "decrease")}
                        onIncrease={() => onQuantityChange(item.id, item.quantity, "increase")}
                        minQuantity={1}
                    />
                </div>
            </div>
        </div>
    </div>
);

// Componente para selector de cantidad
interface QuantitySelectorProps {
    quantity: number;
    onDecrease: () => void;
    onIncrease: () => void;
    minQuantity: number;
}

const QuantitySelector = ({
    quantity,
    onDecrease,
    onIncrease,
    minQuantity
}: QuantitySelectorProps) => (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
        <button
            onClick={onDecrease}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors ${quantity <= minQuantity
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100'
                }`}
            disabled={quantity <= minQuantity}
            aria-label="Disminuir cantidad"
        >
            <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 h-8 flex items-center justify-center text-center text-sm font-medium bg-white rounded-md">
            {quantity}
        </span>
        <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            aria-label="Aumentar cantidad"
        >
            <Plus className="h-4 w-4" />
        </button>
    </div>
);

// Componente para totales y acciones
interface CartTotalsProps {
    subtotal: number;
    discountTotal: number;
    total: number;
    onClearCart: () => void;
    onSchedule: () => void;
    formatCurrency: (amount: number) => string;
}

const CartTotals = ({
    subtotal,
    discountTotal,
    total,
    onClearCart,
    onSchedule,
    formatCurrency
}: CartTotalsProps) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-4xl mx-auto w-full px-4 py-5">
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${formatCurrency(subtotal)}</span>
                </div>

                {discountTotal > 0 && (
                    <div className="flex justify-between text-purple-700">
                        <span>Descuentos:</span>
                        <span className="font-medium">-${formatCurrency(discountTotal)}</span>
                    </div>
                )}

                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total:</span>
                    <span>${formatCurrency(total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={onClearCart}
                        className="flex items-center justify-center gap-2 w-full font-medium py-3 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Trash className="h-4 w-4" />
                        Vaciar
                    </button>

                    <button
                        onClick={onSchedule}
                        className="flex items-center justify-center gap-2 w-full font-medium py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-md transition-all"
                    >
                        <Calendar className="h-4 w-4" />
                        Agendar
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Función auxiliar para formatear moneda (duplicada para uso en componentes hijos)
const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export default CarritoPage;