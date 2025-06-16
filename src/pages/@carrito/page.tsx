import { IonPage, IonContent, IonButton } from "@ionic/react";
import HeaderCart from "../@landing/components/header";
import { useAppSelector, useAppDispatch } from "@/hooks/selector";
import { removeFromCart, updateQuantity, clearCart } from "@/hooks/slices/cart";
import { Calendar, Trash } from "lucide-react";
import { useState, useRef } from "react";
import ModalCita from "./components/modal-cita";

const CarritoPage = () => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) => state.cart.items.filter(item => item.quantity > 0));

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
            <IonContent fullscreen className="relative bg-[#f2f2f7]">
                {cartItems.length === 0 ? (
                    <div className="container mx-auto flex flex-col items-center justify-center h-full p-4">
                        <h1 className="text-2xl font-bold text-center">Carrito de Compras</h1>
                        <p className="mt-4 text-lg text-gray-600">Tu carrito está vacío.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Contenido scrollable */}
                        <ModalCita modal={modal} setShowModal={setShowModal} showModal={showModal} />
                        <div className="container mx-auto flex-1 pb-40">
                            <div className="px-4 pt-4">
                                <h1 className="text-2xl font-bold mb-2">Carrito de Compras</h1>
                                <p className="mb-4 text-gray-600">Tienes {cartItems.length} productos en tu carrito.</p>
                            </div>

                            {/* Listado de productos */}
                            <div className="px-4 mb-32 flex flex-col gap-2">
                                {cartItems.map((item: any, key) => (
                                    <div
                                        key={key}
                                        className="bg-white rounded-lg overflow-hidden transition-all hover:shadow-md border border-gray-100"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
                                            <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center sm:w-24 w-full h-24">
                                                <img
                                                    src={item.image || "/placeholder.svg"}
                                                    alt={item.nombre}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <h3 className="font-medium line-clamp-2 text-lg">{item.nombre}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{item.category}</p>

                                                <div className="my-3 border-t border-gray-100"></div>

                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-gray-900">${item.precio.toFixed(2)}</span>
                                                        {item.precioRegular && (
                                                            <span className="text-sm text-gray-500 line-through">${item.precioRegular.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 ml-2">• {item.unidad}</span>
                                                        <div className="flex items-center border rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, item.quantity, "decrease")}
                                                                className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-3 w-3"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                            <span className="px-3 py-1 text-center min-w-[40px]">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleQuantityChange(item.id, item.quantity, "increase")}
                                                                className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-3 w-3"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => dispatch(removeFromCart(item.id))}
                                                            className="h-8 w-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                            <span className="sr-only">Eliminar</span>
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
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                            <div className="container mx-auto max-w-screen-xl">
                                <div className="px-4 py-2 bg-white">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        {discountTotal > 0 && (<div className="flex justify-between text-purple-800">
                                            <span>Descuentos:</span>
                                            <span>-${discountTotal.toFixed(2)}</span>
                                        </div>)}
                                        <div className="flex justify-between font-bold border-t pt-2">
                                            <span>Total:</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>

                                        <section className="mt-4 flex flex-row gap-2">
                                            <IonButton
                                                onClick={() => dispatch(clearCart())}
                                                color={"danger"}
                                                fill="clear"
                                                expand="block"
                                                size="small"
                                                className="flex items-center gap-2 w-full font-medium py-2 rounded-lg"
                                            >
                                                Vaciar Carrito <Trash className="ml-2 h-4 w-4" />
                                            </IonButton>

                                            <IonButton
                                                onClick={() => setShowModal(true)}
                                                expand="block"
                                                size="small"
                                                className="custom-default flex gap-4 w-full font-medium py-2 rounded-lg"
                                            >

                                                <p>Agendar</p><Calendar className="ml-2 h-4 w-4" />
                                            </IonButton>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage >
    );
}

export default CarritoPage;