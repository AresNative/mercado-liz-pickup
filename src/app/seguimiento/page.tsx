import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import {
    IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonText, IonChip, IonBadge, IonButton, IonIcon,
} from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { motion } from "framer-motion";
import { cn } from "@/utils/functions/cn";
import {
    location, time, storefront,
    receipt, call, navigate, chevronForward,
} from "ionicons/icons";
import { useState } from "react";

interface OrderStatus {
    status: string;
    completed: boolean;
    active: boolean;
    time?: string;
    description?: string;
    icon?: string;
}

interface OrderItem {
    id: string;
    name: string;
    quantity: string;
    price: number;
    unit: string;
    image?: string;
}

const Seguimiento: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const [currentStep] = useState(2);

    const orderStatus: OrderStatus[] = [
        {
            status: "Pedido Recibido",
            completed: true,
            time: "09:30 AM",
            icon: "📨",
            active: true
        },
        {
            status: "Preparando",
            completed: true,
            time: "09:45 AM",
            icon: "🛒",
            active: true
        },
        {
            status: "Listo para Recoger",
            completed: false,
            time: "10:15 AM",
            icon: "🛻",
            active: true,
        },
        {
            status: "Completado",
            completed: false,
            icon: "✅",
            active: false
        },
    ];

    const orderItems: OrderItem[] = [
        { id: "1", name: "Plátanos", quantity: "1", price: 1.49, unit: "kg" },
        { id: "2", name: "Manzanas Rojas", quantity: "4", price: 11.96, unit: "kg" },
    ];

    const orderSummary = { subtotal: 13.45, serviceFee: 2.5, total: 15.95 };
    const pickupDetails = {
        store: "FreshMarket Centro",
        address: "Av. Principal 123, Ciudad Central",
        schedule: "Hoy, 10:00 - 11:00",
        phone: "+1 234 567 8900",
        estimatedTime: "15-20 min",
    };

    const getProgressValue = () => orderStatus.filter(s => s.completed).length / orderStatus.length;
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    return (
        <IonContent fullscreen>
            <IonHeader collapse="condense" className="custom-toolbar z-50 -top-16">
                <IonToolbar>
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>

            <section className="py-1 px-2 max-w-6xl mx-auto min-h-screen space-y-5">
                {/*  Encabezado del pedido  */}
                <div>
                    <IonCardTitle className="text-4xl font-bold text-purple-900">
                        Pedido #S9BLVF
                    </IonCardTitle>
                    <IonText color="medium">
                        <p className="text-sm mt-1">Realizado el 20 Nov, 2024</p>
                    </IonText>
                </div>
                <IonCard className="rounded-2xl border -1border-gray-200 shadow-sm bg-white">
                    <IonCardHeader className="pb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between ">
                            <IonBadge color="success" className="mt-4 md:mt-2 ">
                                {orderStatus.find(s => s.active)?.status}
                            </IonBadge>
                        </div>

                        {/* Barra de progreso */}
                        <div className="relative mt-3">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-green-500 rounded-full -translate-y-1/2 transition-all duration-500"
                                style={{ width: `${getProgressValue() * 100}%` }}
                            />
                            <div className="flex justify-between relative z-10">
                                {orderStatus.map(step => (
                                    <div key={step.status} className="flex flex-col items-center w-1/4 text-center">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border-2 text-xl mb-4 shadow-sm",
                                                step.completed
                                                    ? "bg-green-100 border-green-400 text-white"
                                                    : step.active
                                                        ? "bg-purple-300 border-purple-500 text-white"
                                                        : "bg-white border-gray-300 text-gray-400"
                                            )}
                                        >
                                            {step.icon}
                                        </div>
                                        <p
                                            className={cn(
                                                "text-xs font-medium",
                                                step.active
                                                    ? "text-purple-700 "
                                                    : step.completed
                                                        ? "text-green-600"
                                                        : "text-gray-400"
                                            )}
                                        >
                                            {step.status}
                                        </p>
                                        {step.time && (
                                            <p className="text-[12px] text-gray-500 mt-1">{step.time}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </IonCardHeader>
                </IonCard>

                {/* BentoGrid */}
                <div className="grid gap-1  md:grid-cols-2 ">{ }
                    {/* Recoger en tienda */}
                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white mt-1 mb-1">
                        <IonCardHeader>
                            <IonCardTitle className="flex items-center text-lg font-semibold">
                                <IonIcon icon={location} className="mr-2 text-purple-600" />
                                Recoger en Tienda
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <IonIcon icon={storefront} className="text-purple-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900">{pickupDetails.store}</p>
                                    <p className="text-sm text-gray-500">{pickupDetails.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <IonIcon icon={time} className="text-purple-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900">Horario de Recogida</p>
                                    <p className="text-sm text-gray-500">{pickupDetails.schedule}</p>
                                    <IonChip color="success" className="mt-2">
                                        <IonText className="text-xs">
                                            Tiempo estimado: {pickupDetails.estimatedTime}
                                        </IonText>
                                    </IonChip>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <IonIcon icon={call} className="text-purple-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-gray-900">Contacto</p>
                                    <p className="text-sm text-gray-500">{pickupDetails.phone}</p>
                                </div>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Resumen del pedido */}
                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white mt-1 mb-1">
                        <IonCardHeader>
                            <IonCardTitle className="flex items-center text-lg font-semibold">
                                <IonIcon icon={receipt} className="mr-2 text-purple-600" />
                                Resumen del Pedido
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent className="space-y-3">
                            <div className="flex justify-between py-2">
                                <p className="text-gray-500">
                                    Subtotal ({orderItems.length} productos)
                                </p>
                                <p>{formatCurrency(orderSummary.subtotal)}</p>
                            </div>
                            <div className="flex justify-between py-2">
                                <p className="text-gray-500">Tarifa de servicio</p>
                                <p>{formatCurrency(orderSummary.serviceFee)}</p>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                                <p className="font-bold text-lg">Total</p>
                                <p className="font-bold text-xl text-purple-600">
                                    {formatCurrency(orderSummary.total)}
                                </p>
                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>

                {/* Productos del pedido + Botones  */}
                <div className="space-y-12">
                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white mt-1">
                        <IonCardHeader>
                            <IonCardTitle className="text-xl font-semibold">
                                Productos del Pedido
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent className="space-y-4">
                            {orderItems.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <IconLiz fill="#9CA3AF" width={32} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} {item.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-purple-600 text-lg">
                                        {formatCurrency(item.price)}
                                    </p>
                                </div>
                            ))}
                        </IonCardContent>
                    </IonCard>

                    {/* Botones */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <IonButton expand="block" color="primary" className="rounded-xl h-10 font-semibold">
                            <IonIcon icon={navigate} slot="start" />
                            Ver Ruta en Mapa
                            <IonIcon icon={chevronForward} slot="end" />
                        </IonButton>
                        <IonButton
                            expand="block"
                            color="light"
                            fill="outline"
                            className="rounded-xl h-12 font-semibold"
                        >
                            <IonIcon icon={call} slot="start" />
                            Llamar a la Tienda
                        </IonButton>
                    </div>
                </div>
            </section>
            <Footer />
        </IonContent>
    );
};

export default Seguimiento;