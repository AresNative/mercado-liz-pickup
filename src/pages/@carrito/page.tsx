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
        acc + (item.originalPrice || item.price) * item.quantity, 0);

    const discountTotal = cartItems.reduce((acc, item: any) =>
        item.discount ? acc + ((item.originalPrice! - item.price) * item.quantity) : acc, 0);

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
            <IonContent fullscreen className="relative">
                {cartItems.length === 0 ? (
                    <div className="container mx-auto flex flex-col items-center justify-center h-full p-4">
                        <h1 className="text-2xl font-bold text-center">Carrito de Compras</h1>
                        <p className="mt-4 text-lg text-gray-600">Tu carrito está vacío.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Contenido scrollable */}
                        <ModalCita modal={modal} setShowModal={setShowModal} showModal={showModal} />
                        <div className="container mx-auto flex-1 overflow-auto pb-40">
                            <div className="px-4 pt-4">
                                <h1 className="text-2xl font-bold mb-2">Carrito de Compras</h1>
                                <p className="mb-4 text-gray-600">Tienes {cartItems.length} productos en tu carrito.</p>
                            </div>

                            {/* Listado de productos */}
                            <div className="px-4 mb-32">
                                {cartItems.map((item: any, key) => (
                                    <div key={key} className="flex flex-col sm:flex-row items-start gap-4 p-4 border-b border-b-neutral-300 bg-[#fdfdfd]">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full sm:w-24 h-24 object-contain rounded-lg"
                                        />
                                        <div className="flex-1 w-full">
                                            <h3 className="font-medium line-clamp-2">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{item.category}</p>

                                            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold">
                                                        ${item.price.toFixed(2)}
                                                    </span>
                                                    {item.originalPrice && (
                                                        <span className="text-sm text-gray-500 line-through">
                                                            ${item.originalPrice.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity, 'decrease')}
                                                        className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-2">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity, 'increase')}
                                                        className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => dispatch(removeFromCart(item.id))}
                                                        className="ml-2 text-red-500 hover:text-red-600"
                                                    >
                                                        Eliminar
                                                    </button>
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
                                        <div className="flex justify-between text-red-600">
                                            <span>Descuentos:</span>
                                            <span>-${discountTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t pt-2">
                                            <span>Total:</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>

                                        <section className="mt-4 flex flex-row gap-2">
                                            <IonButton
                                                onClick={() => dispatch(clearCart())}
                                                color={"danger"}
                                                className="flex items-center gap-2 content-center w-full font-medium py-2 rounded-lg"
                                            >
                                                Vaciar Carrito <Trash />
                                            </IonButton>

                                            <IonButton
                                                onClick={() => setShowModal(true)}
                                                className="flex gap-2 items-center content-center w-full custom-tertiary font-medium py-2 rounded-lg">
                                                Agendar Recoleccion <Calendar />
                                            </IonButton>
                                        </section>
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