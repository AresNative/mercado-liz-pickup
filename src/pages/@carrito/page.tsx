import { IonPage, IonContent } from "@ionic/react";
import HeaderCart from "../@landing/components/header";
import { useAppSelector } from "@/hooks/selector";

const CarritoPage = () => {
    const cartItems = useAppSelector((state) => state.cart.items.filter(item => item.quantity > 0));
    //! agregar modal de https://ionicframework.com/docs/api/modal#setting-a-callback-function
    // Cálculos de totales
    const subtotal = cartItems.reduce((acc, item: any) =>
        acc + (item.originalPrice || item.price) * item.quantity, 0);

    const discountTotal = cartItems.reduce((acc, item: any) =>
        item.discount ? acc + ((item.originalPrice! - item.price) * item.quantity) : acc, 0);

    const total = subtotal - discountTotal;

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
                        <div className="container mx-auto flex-1 overflow-auto pb-40">
                            <div className="px-4 pt-4">
                                <h1 className="text-2xl font-bold mb-2">Carrito de Compras</h1>
                                <p className="mb-4 text-gray-600">Tienes {cartItems.length} productos en tu carrito.</p>
                            </div>

                            {/* Listado de productos */}
                            <div className="space-y-3 px-4">
                                {cartItems.map((item: any) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg bg-white">
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
                                                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                    x {item.quantity}
                                                </span>
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