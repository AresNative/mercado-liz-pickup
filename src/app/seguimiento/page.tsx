import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonChip,
    IonBadge,
    IonButton,
    IonIcon,
    IonProgressBar
} from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { motion } from "framer-motion";
import { cn } from "@/utils/functions/cn";
import { location, time, storefront, receipt, call, navigate, chevronForward } from "ionicons/icons";
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
    const [currentStep] = useState(2); // 0: Recibido, 1: Preparando, 2: Listo, 3: Completado

    const orderStatus: OrderStatus[] = [
        {
            status: 'Pedido Recibido',
            completed: true,
            active: false,
            time: '09:30 AM',
            description: 'Tu pedido ha sido confirmado',
            icon: '✓'
        },
        {
            status: 'Preparando',
            completed: true,
            active: false,
            time: '09:45 AM',
            description: 'Estamos preparando tus productos',
            icon: '🛒'
        },
        {
            status: 'Listo para Recoger',
            completed: true,
            active: true,
            time: '10:15 AM',
            description: 'Tu pedido está listo para recoger',
            icon: '✅'
        },
        {
            status: 'Completado',
            completed: false,
            active: false,
            description: 'Pedido entregado satisfactoriamente',
            icon: '🎉'
        },
    ];

    const orderItems: OrderItem[] = [
        {
            id: '1',
            name: 'Plátanos',
            quantity: '1',
            price: 1.49,
            unit: 'kg',
            image: '/placeholder-banana.jpg'
        },
        {
            id: '2',
            name: 'Manzanas Rojas',
            quantity: '4',
            price: 11.96,
            unit: 'kg',
            image: '/placeholder-apple.jpg'
        },
    ];

    const orderSummary = {
        subtotal: 13.45,
        serviceFee: 2.50,
        total: 15.95,
    };

    const pickupDetails = {
        store: 'FreshMarket Centro',
        address: 'Av. Principal 123, Ciudad Central',
        schedule: 'Hoy, 10:00 - 11:00',
        phone: '+1 234 567 8900',
        estimatedTime: '15-20 min'
    };

    const getProgressValue = () => {
        const completedSteps = orderStatus.filter(step => step.completed).length;
        return completedSteps / orderStatus.length;
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}
        >
            <IonHeader
                collapse="condense"
                className="custom-toolbar z-50 -top-16"
            >
                <IonToolbar>
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>

            <section className="py-16 px-4 max-w-6xl min-h-screen mx-auto">
                {/* Header del Pedido */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <IonCardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <IonCardTitle className="text-2xl font-bold text-purple-900">
                                        Pedido #S9BLVF
                                    </IonCardTitle>
                                    <IonText color="medium">
                                        <p className="text-sm mt-1">Realizado el 20 Nov, 2024</p>
                                    </IonText>
                                </div>
                                <IonBadge color="success" className="mt-2 md:mt-0">
                                    {orderStatus.find(s => s.active)?.status}
                                </IonBadge>
                            </div>

                            <IonProgressBar
                                value={getProgressValue()}
                                color="success"
                                className="h-2 rounded-full mt-4"
                            />

                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Recibido</span>
                                <span>Preparando</span>
                                <span>Listo</span>
                                <span>Completado</span>
                            </div>
                        </IonCardHeader>
                    </IonCard>
                </motion.div>

                <IonGrid className="p-0">
                    <IonRow>
                        {/* Columna Principal - Timeline */}
                        <IonCol size="12" sizeLg="8">
                            {/* Timeline del Estado */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mb-6"
                            >
                                <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                                    <IonCardHeader>
                                        <IonCardTitle className="flex items-center text-xl font-semibold">
                                            <IonIcon icon={time} className="mr-3 text-purple-600" />
                                            Progreso del Pedido
                                        </IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <div className="space-y-6">
                                            {orderStatus.map((status, index) => (
                                                <div key={status.status} className="flex items-start space-x-4">
                                                    {/* Línea vertical e ícono */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-full flex items-center justify-center border-2 text-lg",
                                                            status.completed
                                                                ? "bg-green-500 border-green-500 text-white"
                                                                : status.active
                                                                    ? "bg-purple-500 border-purple-500 text-white"
                                                                    : "bg-gray-100 border-gray-300 text-gray-400"
                                                        )}>
                                                            {status.icon}
                                                        </div>
                                                        {index < orderStatus.length - 1 && (
                                                            <div className={cn(
                                                                "w-1 h-16 flex-1",
                                                                status.completed ? "bg-green-500" : "bg-gray-300"
                                                            )}></div>
                                                        )}
                                                    </div>

                                                    {/* Contenido del estado */}
                                                    <div className="flex-1 pb-6">
                                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                                            <div className="flex-1">
                                                                <IonText>
                                                                    <p className={cn(
                                                                        "font-semibold text-lg mb-1",
                                                                        status.active
                                                                            ? "text-purple-600"
                                                                            : status.completed
                                                                                ? "text-green-600"
                                                                                : "text-gray-500"
                                                                    )}>
                                                                        {status.status}
                                                                    </p>
                                                                </IonText>
                                                                {status.description && (
                                                                    <IonText color="medium">
                                                                        <p className="text-sm">{status.description}</p>
                                                                    </IonText>
                                                                )}
                                                            </div>
                                                            {status.time && (
                                                                <IonChip color="light" className="mt-2 md:mt-0">
                                                                    <IonText color="medium">
                                                                        <p className="text-sm font-medium">{status.time}</p>
                                                                    </IonText>
                                                                </IonChip>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </motion.div>

                            {/* Productos del Pedido */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                                    <IonCardHeader>
                                        <IonCardTitle className="text-xl font-semibold">
                                            Productos del Pedido
                                        </IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <div className="space-y-4">
                                            {orderItems.map((item) => (
                                                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <IconLiz fill="#9CA3AF" width={32} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <IonText>
                                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                                        </IonText>
                                                        <IonText color="medium">
                                                            <p className="text-sm">{item.quantity} {item.unit}</p>
                                                        </IonText>
                                                    </div>
                                                    <IonText>
                                                        <p className="font-bold text-purple-600 text-lg">
                                                            {formatCurrency(item.price)}
                                                        </p>
                                                    </IonText>
                                                </div>
                                            ))}
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </motion.div>
                        </IonCol>

                        {/* Sidebar - Información Lateral */}
                        <IonCol size="12" sizeLg="4">
                            <div className="space-y-6">
                                {/* Información de Recogida */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                                        <IonCardHeader>
                                            <IonCardTitle className="flex items-center text-lg font-semibold">
                                                <IonIcon icon={location} className="mr-2 text-purple-600" />
                                                Recoger en Tienda
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-3">
                                                    <IonIcon icon={storefront} className="text-purple-600 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <IonText>
                                                            <p className="font-semibold text-gray-900">{pickupDetails.store}</p>
                                                        </IonText>
                                                        <IonText color="medium">
                                                            <p className="text-sm mt-1">{pickupDetails.address}</p>
                                                        </IonText>
                                                    </div>
                                                </div>

                                                <div className="flex items-start space-x-3">
                                                    <IonIcon icon={time} className="text-purple-600 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <IonText>
                                                            <p className="font-semibold text-gray-900">Horario de Recogida</p>
                                                        </IonText>
                                                        <IonText color="medium">
                                                            <p className="text-sm mt-1">{pickupDetails.schedule}</p>
                                                        </IonText>
                                                        <IonChip color="success" className="mt-2">
                                                            <IonText className="text-xs">
                                                                Tiempo estimado: {pickupDetails.estimatedTime}
                                                            </IonText>
                                                        </IonChip>
                                                    </div>
                                                </div>

                                                <div className="flex items-start space-x-3">
                                                    <IonIcon icon={call} className="text-purple-600 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <IonText>
                                                            <p className="font-semibold text-gray-900">Contacto</p>
                                                        </IonText>
                                                        <IonText color="medium">
                                                            <p className="text-sm mt-1">{pickupDetails.phone}</p>
                                                        </IonText>
                                                    </div>
                                                </div>
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                </motion.div>

                                {/* Resumen del Pedido */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                                        <IonCardHeader>
                                            <IonCardTitle className="flex items-center text-lg font-semibold">
                                                <IonIcon icon={receipt} className="mr-2 text-purple-600" />
                                                Resumen del Pedido
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2">
                                                    <IonText color="medium">
                                                        <p>Subtotal ({orderItems.length} productos)</p>
                                                    </IonText>
                                                    <IonText>
                                                        <p>{formatCurrency(orderSummary.subtotal)}</p>
                                                    </IonText>
                                                </div>

                                                <div className="flex justify-between items-center py-2">
                                                    <IonText color="medium">
                                                        <p>Tarifa de servicio</p>
                                                    </IonText>
                                                    <IonText>
                                                        <p>{formatCurrency(orderSummary.serviceFee)}</p>
                                                    </IonText>
                                                </div>

                                                <div className="border-t border-gray-200 pt-3 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <IonText>
                                                            <p className="font-bold text-lg">Total</p>
                                                        </IonText>
                                                        <IonText>
                                                            <p className="font-bold text-xl text-purple-600">
                                                                {formatCurrency(orderSummary.total)}
                                                            </p>
                                                        </IonText>
                                                    </div>
                                                </div>
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                </motion.div>

                                {/* Acciones Rápidas */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-col space-y-3"
                                >
                                    <IonButton
                                        expand="block"
                                        color="primary"
                                        className="rounded-xl h-12 font-semibold"
                                        onClick={() => {/* Navegar al mapa */ }}
                                    >
                                        <IonIcon icon={navigate} slot="start" />
                                        Ver Ruta en Mapa
                                        <IonIcon icon={chevronForward} slot="end" />
                                    </IonButton>

                                    <IonButton
                                        expand="block"
                                        color="light"
                                        fill="outline"
                                        className="rounded-xl h-12 font-semibold"
                                        onClick={() => {/* Llamar a la tienda */ }}
                                    >
                                        <IonIcon icon={call} slot="start" />
                                        Llamar a la Tienda
                                    </IonButton>
                                </motion.div>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </section>
            <Footer />
        </IonContent>
    );
}

export default Seguimiento;