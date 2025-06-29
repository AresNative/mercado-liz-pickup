import { IonButton, IonContent, IonPage, IonSegment, IonSegmentButton } from "@ionic/react";

const Layout: React.FC = () => {
    return (
        <IonPage>
            <IonContent role="feed">
                <div className="checkout-container p-4">
                    <h1 className="text-2xl font-bold mb-4">Checkout</h1>
                    <div className="checkout-content grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                            <IonSegment value="review" className="mb-6">
                                <IonSegmentButton value="shipping">
                                    Envío
                                </IonSegmentButton>
                                <IonSegmentButton value="payment">
                                    Pago
                                </IonSegmentButton>
                                <IonSegmentButton value="review">
                                    Revisión
                                </IonSegmentButton>
                            </IonSegment>
                            <div className="order-review border p-4 rounded-lg shadow-md">
                                <h2 className="text-xl font-bold mb-4">Revisar tu pedido</h2>
                                <p className="mb-4">Por favor revisa los detalles de tu pedido antes de realizarlo.</p>
                                <div className="shipping-address mb-4">
                                    <h3 className="text-lg font-bold mb-2">Dirección de Envío</h3>
                                    <p>John Doe</p>
                                    <p>123 Main St</p>
                                    <p>New York, NY 10001</p>
                                    <p>Estados Unidos</p>
                                </div>
                                <div className="payment-method mb-4">
                                    <h3 className="text-lg font-bold mb-2">Método de Pago</h3>
                                    <p>Tarjeta de Crédito terminada en 3456</p>
                                </div>
                                <div className="items mb-4">
                                    <h3 className="text-lg font-bold mb-2">Artículos</h3>
                                    <div className="item flex items-center justify-between border-b pb-2 mb-2">
                                        <img src="placeholder-image.png" alt="Wireless Bluetooth Headphones" className="w-16 h-16 object-cover" />
                                        <div className="flex-1 ml-4">
                                            <p>Auriculares Bluetooth Inalámbricos</p>
                                            <p className="text-sm text-gray-500">Cantidad: 1 × $99.99</p>
                                        </div>
                                        <p className="font-medium">$99.99</p>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <IonButton color={"tertiary"} fill="outline">Atrás</IonButton>
                                    <IonButton className="custom-tertiary">Realizar Pedido</IonButton>
                                </div>
                            </div>
                        </section>
                        <div className="order-summary bg-gray-100 p-4 rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
                            <div className="summary-item flex justify-between mb-2">
                                <span>Subtotal (1 artículo)</span>
                                <span>$99.99</span>
                            </div>
                            <div className="summary-item flex justify-between mb-2">
                                <span>Envío</span>
                                <span>$5.99</span>
                            </div>
                            <div className="summary-item flex justify-between mb-2">
                                <span>Impuestos</span>
                                <span>$8.00</span>
                            </div>
                            <div className="summary-total flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>$113.98</span>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    )
}
export default Layout;