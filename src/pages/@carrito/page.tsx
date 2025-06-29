import { IonPage, IonContent } from "@ionic/react";
import HeaderCart from "../@landing/components/header";
import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { removeFromCart, updateQuantity, clearCart } from "@/hooks/slices/cart";
import { Calendar, Trash, Minus, Plus } from "lucide-react";
import { useState, useRef } from "react";
import ModalCita from "./components/modal-cita";

const CarritoPage = () => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) => state.cart.items.filter(item => item.quantity > 0));
    const cartItemsWithDiscount = cartItems.map((item: any) => ({
        ...item,
        hasDiscount: item.precioRegular && item.descuento,
        finalPrice: (item.precioRegular && item.descuento) ? item.precioRegular : item.precio,
        savings: (item.precioRegular && item.descuento)
            ? (item.precio - (item.precioRegular || 0)).toFixed(2)
            : 0
    }));
    // Cálculos de totales
    const subtotal = cartItems.reduce((acc, item: any) =>
        acc + (item.precioRegular || item.precio) * item.quantity, 0);

    const discountTotal = cartItems.reduce((acc, item: any) =>
        item.discount ? acc + ((item.precioRegular! - item.precio) * item.quantity) : acc, 0);

    const total = subtotal - discountTotal;

    const handleQuantityChange = (id: string | number, currentQuantity: number, operation: 'increase' | 'decrease') => {
        const newQuantity = operation === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

        if (newQuantity < 1) {
            dispatch(removeFromCart(id));
        } else {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        }
    };

    const [showModal, setShowModal] = useState(false);
    const modal = useRef<HTMLIonModalElement>(null);

    return (
        <IonPage>
            <HeaderCart back />
            <IonContent role="feed" fullscreen className="relative bg-gray-50">
                {cartItems.length === 0 ? (
                    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-gray-100 rounded-full p-6 mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">Carrito de Compras</h1>
                        <p className="text-gray-600 mb-6">Tu carrito está vacío.</p>
                        <a
                            href="/"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:shadow-md transition-all"
                        >
                            Explorar productos
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-col h-full mb-64">
                        {/* Contenido scrollable */}
                        <ModalCita modal={modal} setShowModal={setShowModal} showModal={showModal} />
                        <div className="max-w-4xl mx-auto w-full px-4">
                            <div className="pt-6 pb-4">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">Carrito de Compras</h1>
                                <p className="text-gray-600">
                                    Tienes <span className="font-medium text-purple-700">{cartItems.length}</span> {cartItems.length === 1 ? 'producto' : 'productos'} en tu carrito
                                </p>
                            </div>

                            {/* Listado de productos */}
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                {cartItemsWithDiscount.map((item: any, key) => (
                                    <div
                                        key={key}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                    >
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
                                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.nombre}</h3>
                                                        <p className="text-sm text-gray-500 mt-1 capitalize">{item.categoria}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => dispatch(removeFromCart(item.id))}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-bold text-gray-900">
                                                                    ${item.finalPrice.toFixed(2)}
                                                                </span>
                                                                {item.hasDiscount && (
                                                                    <span className="text-sm text-gray-400 line-through">
                                                                        ${item.precio.toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.hasDiscount && (
                                                                <span className="text-xs text-green-600 mt-1">
                                                                    Ahorras ${item.savings}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-500 mt-1">{item.unidad}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity, "decrease")}
                                                            className={`
                                                                w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors
                                                                ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
                                                            `}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-10 h-8 flex items-center justify-center text-center text-sm font-medium bg-white rounded-md">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity, "increase")}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sección de totales fija */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
                            <div className="max-w-4xl mx-auto w-full px-4 py-5">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">${subtotal.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</span>
                                    </div>
                                    {discountTotal > 0 && (
                                        <div className="flex justify-between text-purple-700">
                                            <span>Descuentos:</span>
                                            <span className="font-medium">-${discountTotal.toLocaleString('es-MX', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
                                        <span>Total:</span>
                                        <span>${total.toLocaleString('es-MX', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            onClick={() => dispatch(clearCart())}
                                            className="flex items-center justify-center gap-2 w-full font-medium py-3 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash className="h-4 w-4" />
                                            Vaciar
                                        </button>

                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="flex items-center justify-center gap-2 w-full font-medium py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-md transition-all"
                                        >
                                            <Calendar className="h-4 w-4" />
                                            Agendar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
}

export default CarritoPage;