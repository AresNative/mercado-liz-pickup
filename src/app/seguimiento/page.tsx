import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import {
    IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonText, IonChip, IonBadge, IonButton, IonIcon,
} from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { cn } from "@/utils/functions/cn";
import {
    location, time, storefront,
    receipt, call, navigate, chevronForward,
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

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

interface ListaItem {
    id: string;
    articulo: string;
    categoria: string;
    nombre: string;
    precio: number;
    precioRegular: number;
    unidad: string;
    cantidad: number;
    factor: number;
    quantity: number;
    recolectado?: boolean;
    noEncontrado?: boolean;
    impuesto1?: number;
    impuesto2?: number;
    tipoImpuesto1?: string;
    tipoImpuesto2?: string | number;
    descuento?: number;
}

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
}

interface Pedido {
    id: number;
    id_lista: number;
    id_cliente: number;
    usuario_id: number;
    sucursal_id: number;
    nombre_lista: string;
    tipo_lista: string;
    servicio: string;
    array_lista: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    estado: 'nuevo' | 'proceso' | 'listo' | 'entregado' | 'cancelado' | 'incompleto';
    es_publica: number;
    items: ListaItem[];
    cliente?: Cliente;
    nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
    total: number;
    urgencia?: 'alta' | 'media' | 'baja';
    tiempo_restante?: number;
}

const Seguimiento: React.FC<PageProps> = ({ onScroll }: PageProps) => {

    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [currentStep] = useState(2);
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);

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

    // Función para parsear array_lista y calcular total
    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let total = 0;

        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                total = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
            }
        } catch (error) {
            console.error('Error parsing array_lista:', error);
            items = [];
        }

        const calcularUrgencia = (fechaCita: string, estado: string): { urgencia: 'alta' | 'media' | 'baja', tiempo_restante: number } => {
            if (estado !== 'nuevo' && estado !== 'proceso') {
                return { urgencia: 'baja', tiempo_restante: 0 };
            }

            if (!fechaCita) return { urgencia: 'baja', tiempo_restante: 0 };

            const ahora = new Date();
            const cita = new Date(fechaCita);
            const diferenciaMs = cita.getTime() - ahora.getTime();
            const minutosRestantes = Math.floor(diferenciaMs / (1000 * 60));

            let urgencia: 'alta' | 'media' | 'baja' = 'baja';
            if (minutosRestantes <= 30) urgencia = 'alta';
            else if (minutosRestantes <= 120) urgencia = 'media';

            return { urgencia, tiempo_restante: minutosRestantes };
        };

        const { urgencia, tiempo_restante } = calcularUrgencia(lista.nombre_lista, lista.estado);

        return {
            id: lista.id,
            id_lista: lista.id,
            id_cliente: lista.id_cliente,
            usuario_id: lista.usuario_id,
            sucursal_id: lista.sucursal_id,
            nombre_lista: lista.nombre_lista,
            tipo_lista: lista.tipo_lista,
            servicio: lista.servicio,
            array_lista: lista.array_lista,
            fecha_creacion: lista.fecha_creacion,
            fecha_actualizacion: lista.fecha_actualizacion,
            estado: lista.estado,
            es_publica: lista.es_publica,
            items: items,
            cliente: lista.nombre ? {
                id: lista.id_cliente,
                nombre: lista.nombre,
                telefono: lista.telefono,
                email: lista.email,
                direccion: lista.direccion,
                ciudad: lista.ciudad,
                estado: lista.estado
            } : undefined,
            nombre: lista.nombre || `Cliente ${lista.id_cliente}`,
            cliente_telefono: lista.telefono || 'N/A',
            cliente_email: lista.email || 'N/A',
            total: total,
            urgencia,
            tiempo_restante
        };
    }

    const fetchPedidos = useCallback(async () => {
        try {
            setLoading(true);

            const userId = getLocalStorageItem("user-id");
            if (!userId) {
                console.error("User ID not found in local storage");
                setLoading(false);
                return;
            }

            const filtros: any = {
                Selects: [
                    { key: "listas.id" },
                    { key: "listas.id_cliente" },
                    { key: "listas.nombre_lista" },
                    { key: "listas.tipo_lista" },
                    { key: "listas.servicio" },
                    { key: "listas.array_lista" },
                    { key: "listas.fecha_creacion" },
                    { key: "listas.fecha_actualizacion" },
                    { key: "listas.estado" },
                    { key: "clientes.nombre" },
                    { key: "clientes.telefono" },
                    { key: "clientes.email" },
                    { key: "clientes.direccion" },
                    { key: "clientes.usuario_id" },
                ],
                Filtros: [
                    { key: "clientes.usuario_id", value: userId, operator: "=" },
                ],
                Order: [
                    { Key: "listas.fecha_creacion", Direction: "Desc" }
                ]
            };

            const response = await getWithFilter({
                table: "listas left join clientes on listas.usuario_id = clientes.usuario_id",
                pageSize: 10,
                page: 1,
                tag: 'Pedidos',
                filtros: filtros
            }).unwrap();

            if (response && response.data && response.data.length > 0) {
                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                // Ordenar pedidos y tomar el más reciente
                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const prioridadEstado = { 'nuevo': 3, 'proceso': 2, 'listo': 1, 'entregado': 0, 'cancelado': 0, 'incompleto': 0 };
                    const prioridadEstadoA = prioridadEstado[a.estado] || 0;
                    const prioridadEstadoB = prioridadEstado[b.estado] || 0;

                    if (prioridadEstadoA !== prioridadEstadoB) {
                        return prioridadEstadoB - prioridadEstadoA;
                    }

                    if (a.estado === 'nuevo' || a.estado === 'proceso') {
                        const prioridadUrgencia = { 'alta': 3, 'media': 2, 'baja': 1 };
                        return (prioridadUrgencia[b.urgencia || 'baja'] - prioridadUrgencia[a.urgencia || 'baja']);
                    }

                    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                });

                // Establecer el pedido más reciente
                setPedido(pedidosOrdenados[0]);
            } else {
                console.log("No se encontraron pedidos para este cliente");
            }
        } catch (error) {
            console.error("Error fetching pedidos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    // Convertir items del pedido al formato OrderItem
    const orderItems: OrderItem[] = pedido?.items?.map(item => ({
        id: item.id,
        name: item.nombre,
        quantity: item.quantity.toString(),
        price: item.precio,
        unit: item.unidad
    })) || [];

    // Formatear fecha
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <IonContent
                fullscreen
                scrollEvents
                onIonScroll={(e) => {
                    const isScrolled = e.detail.scrollTop > 10;
                    onScroll?.(isScrolled);
                }}>
                <IonHeader collapse="condense" className="custom-toolbar h-fit absolute -top-0">
                    <IonToolbar>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </IonToolbar>
                </IonHeader>
                <div className="flex justify-center items-center min-h-screen">
                    <IonText>Cargando pedidos...</IonText>
                </div>
            </IonContent>
        );
    }

    if (!pedido) {
        return (
            <IonContent
                fullscreen
                scrollEvents
                onIonScroll={(e) => {
                    const isScrolled = e.detail.scrollTop > 10;
                    onScroll?.(isScrolled);
                }}>
                <IonHeader collapse="condense" className="custom-toolbar h-fit absolute -top-0">
                    <IonToolbar>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </IonToolbar>
                </IonHeader>
                <div className="flex justify-center items-center min-h-screen">
                    <IonText>No se encontraron pedidos</IonText>
                </div>
            </IonContent>
        );
    }

    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 10;
                onScroll?.(isScrolled);
            }}>
            <IonHeader collapse="condense" className="custom-toolbar h-fit absolute -top-0">
                <IonToolbar>
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>

            <section className="py-1 px-2 max-w-6xl mx-auto min-h-screen space-y-5">
                {/* Encabezado del pedido */}
                <div>
                    <IonCardTitle className="text-4xl font-bold text-purple-900">
                        Pedido #{pedido.id}
                    </IonCardTitle>
                    <IonText color="medium">
                        <p className="text-sm mt-1">Realizado el {formatFecha(pedido.fecha_creacion)}</p>
                    </IonText>
                </div>

                <IonCard className="rounded-2xl border -1border-gray-200 shadow-sm bg-white">
                    <IonCardHeader className="pb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between ">
                            <IonBadge
                                color={
                                    pedido.estado === 'entregado' ? 'success' :
                                        pedido.estado === 'cancelado' ? 'danger' :
                                            pedido.estado === 'incompleto' ? 'warning' : 'primary'
                                }
                                className="mt-4 md:mt-2 "
                            >
                                {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
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
                <div className="grid gap-1  md:grid-cols-2 ">
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
                                <p>{formatCurrency(pedido.total)}</p>
                            </div>
                            <div className="flex justify-between py-2">
                                <p className="text-gray-500">Tarifa de servicio</p>
                                <p>{formatCurrency(orderSummary.serviceFee)}</p>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                                <p className="font-bold text-lg">Total</p>
                                <p className="font-bold text-xl text-purple-600">
                                    {formatCurrency(pedido.total + orderSummary.serviceFee)}
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
                </div>
            </section>
            <Footer />
        </IonContent>
    );
};

export default Seguimiento;