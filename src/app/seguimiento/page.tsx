import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import {
    IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonText, IonChip, IonBadge, IonIcon, IonSegment, IonSegmentButton,
    IonButton, IonAlert
} from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { cn } from "@/utils/functions/cn";
import {
    location, time, storefront,
    receipt, call, closeCircle
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { useGetWithFiltersGeneralMutation, usePutGeneralMutation } from "@/hooks/reducers/api";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { formatValue } from "@/utils/constants/format-values";
import { ShoppingCart, MoveRight } from "lucide-react";
import { usePedidosSignalR } from "./utils/signalr-pedidos";

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
    descuento?: number;
    precioRegular?: number;
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
    const [putGeneral] = usePutGeneralMutation();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [segmentoActivo, setSegmentoActivo] = useState<'activos' | 'todos'>('activos');
    const [loading, setLoading] = useState(true);
    const [showCancelAlert, setShowCancelAlert] = useState(false);

    // Callbacks para SignalR
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log("Pedido actualizado via SignalR:", pedidoActualizado);

        setPedidos(prevPedidos => {
            const nuevosPedidos = prevPedidos.map(pedido =>
                pedido.id === pedidoActualizado.id
                    ? parseListaData(pedidoActualizado)
                    : pedido
            );

            // Actualizar también el pedido seleccionado si es el mismo
            setPedidoSeleccionado(prev =>
                prev && prev.id === pedidoActualizado.id
                    ? parseListaData(pedidoActualizado)
                    : prev
            );

            return nuevosPedidos;
        });
    }, []);

    const handleNuevoPedido = useCallback((nuevoPedido: any) => {
        console.log("Nuevo pedido via SignalR:", nuevoPedido);

        setPedidos(prevPedidos => {
            const pedidoProcesado = parseListaData(nuevoPedido);
            // Agregar al inicio de la lista
            return [pedidoProcesado, ...prevPedidos];
        });
    }, []);

    const handlePedidoBorrado = useCallback((idPedido: number) => {
        console.log("Pedido borrado via SignalR:", idPedido);

        setPedidos(prevPedidos => {
            const nuevosPedidos = prevPedidos.filter(pedido => pedido.id !== idPedido);

            // Si el pedido seleccionado fue borrado, limpiar selección
            if (pedidoSeleccionado?.id === idPedido) {
                setPedidoSeleccionado(nuevosPedidos.length > 0 ? nuevosPedidos[0] : null);
            }

            return nuevosPedidos;
        });
    }, [pedidoSeleccionado]);

    const handleRefrescar = useCallback(() => {
        console.log("Refrescar pedidos via SignalR");
        fetchPedidos();
    }, []);

    // SignalR con callbacks corregidos
    const { connection, isConnected, notificarCambioLista } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoBorrado,
        handleRefrescar
    );

    // Función para determinar el orderStatus basado en el estado del pedido
    const getOrderStatus = (pedido: Pedido): OrderStatus[] => {
        const fechaCreacion = new Date(pedido.fecha_creacion);
        const fechaActualizacion = new Date(pedido.fecha_actualizacion);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        };

        const baseStatus: OrderStatus[] = [
            {
                status: "Pedido Recibido",
                completed: true,
                time: formatTime(fechaCreacion),
                icon: "📨",
                active: true
            },
            {
                status: "Preparando",
                completed: ['proceso', 'listo', 'entregado'].includes(pedido.estado),
                time: ['proceso', 'listo', 'entregado'].includes(pedido.estado) ?
                    formatTime(fechaActualizacion) : undefined,
                icon: "🛒",
                active: ['proceso', 'listo', 'entregado'].includes(pedido.estado)
            },
            {
                status: "Listo para Recoger",
                completed: ['listo', 'entregado'].includes(pedido.estado),
                time: ['listo', 'entregado'].includes(pedido.estado) ?
                    formatTime(fechaActualizacion) : undefined,
                icon: "🛻",
                active: ['listo', 'entregado'].includes(pedido.estado),
            },
            {
                status: pedido.estado === 'entregado' ? "Entregado" : "Completado",
                completed: pedido.estado === 'entregado',
                time: pedido.estado === 'entregado' ? formatTime(fechaActualizacion) : undefined,
                icon: pedido.estado === 'entregado' ? "✅" : "📦",
                active: pedido.estado === 'entregado'
            },
        ];

        // Para pedidos cancelados o incompletos
        if (pedido.estado === 'cancelado' || pedido.estado === 'incompleto') {
            return baseStatus.map(status => ({
                ...status,
                completed: status.status === "Pedido Recibido",
                active: status.status === "Pedido Recibido",
                icon: status.status === "Pedido Recibido" ? "📨" : "❌"
            }));
        }

        return baseStatus;
    };

    const pickupDetails = {
        store: "Sucursal Mayoreo",
        address: "Calle Principal 216, 22750",
        schedule: "Hoy, 10:00 - 11:00",
        phone: "+52 (646) 155 2258",
        estimatedTime: "15-20 min",
    };

    const getProgressValue = (orderStatus: OrderStatus[]) => {
        const completed = orderStatus.filter(s => s.completed).length;
        return completed / orderStatus.length;
    };

    // Función para calcular porcentaje de descuento (igual que en el card)
    const calculateDiscountPercentage = (precio: number, descuento?: number) => {
        if (!descuento) return 0;
        const percentage = ((precio - descuento) / precio) * 100;
        return Math.round(percentage);
    };

    // Función para cancelar pedido
    const handleCancelarPedido = async () => {
        if (!pedidoSeleccionado) return;

        try {
            await putGeneral({
                table: "listas",
                id: pedidoSeleccionado.id,
                data: {
                    estado: 'cancelado',
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            // Actualizar localmente
            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                estado: 'cancelado',
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // Actualizar la lista de pedidos
            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoSeleccionado.id
                    ? { ...pedido, estado: 'cancelado', fecha_actualizacion: new Date().toISOString() }
                    : pedido
            ));

            console.log(`Pedido #${pedidoSeleccionado.id} cancelado exitosamente`);

            // Notificar via SignalR
            if (isConnected && connection) {
                await notificarCambioLista("updated", pedidoSeleccionado);
            }

        } catch (error) {
            console.error("Error cancelando pedido:", error);
        } finally {
            setShowCancelAlert(false);
        }
    };

    // Función para parsear array_lista y calcular total (MOVIDA ARRIBA para usarla en los callbacks)
    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let total = 0;

        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                // Calcular total considerando descuentos
                total = items.reduce((sum, item) => {
                    const precioFinal = item.descuento ? item.descuento : item.precio;
                    return sum + (precioFinal * item.quantity);
                }, 0);
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
                estado: lista.estado_cliente
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
                    { key: "clientes.ciudad" },
                    { key: "clientes.estado", alias: "estado_cliente" },
                    { key: "clientes.usuario_id" },
                ],
                Filtros: [
                    { key: "listas.usuario_id", value: userId, operator: "=" },
                ],
                Order: [
                    { Key: "listas.fecha_creacion", Direction: "Desc" }
                ]
            };

            const response = await getWithFilter({
                table: "listas left join clientes on listas.id_cliente = clientes.id",
                pageSize: 20,
                page: 1,
                tag: 'Pedidos',
                filtros: filtros
            }).unwrap();

            if (response && response.data && response.data.length > 0) {
                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                // Ordenar pedidos: activos primero, luego por fecha
                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const estadosActivos = ['nuevo', 'proceso', 'listo'];
                    const esAActivo = estadosActivos.includes(a.estado);
                    const esBActivo = estadosActivos.includes(b.estado);

                    if (esAActivo && !esBActivo) return -1;
                    if (!esAActivo && esBActivo) return 1;

                    // Si ambos son activos o ambos son inactivos, ordenar por fecha
                    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                });

                setPedidos(pedidosOrdenados);
                if (pedidosOrdenados.length > 0) {
                    setPedidoSeleccionado(pedidosOrdenados[0]);
                }
            } else {
                console.log("No se encontraron pedidos para este cliente");
                setPedidos([]);
            }
        } catch (error) {
            console.error("Error fetching pedidos:", error);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    }, [getWithFilter]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    // Efecto para reconectar SignalR cuando cambia la conexión
    useEffect(() => {
        if (isConnected) {
            console.log("✅ SignalR conectado - Escuchando actualizaciones en tiempo real");
        } else {
            console.log("❌ SignalR desconectado");
        }
    }, [isConnected]);

    // Filtrar pedidos según el segmento activo
    const pedidosFiltrados = segmentoActivo === 'activos'
        ? pedidos.filter(pedido => ['nuevo', 'proceso', 'listo'].includes(pedido.estado))
        : pedidos;

    // Convertir items del pedido al formato OrderItem
    const orderItems: OrderItem[] = pedidoSeleccionado?.items?.map(item => ({
        id: item.id,
        name: item.nombre,
        quantity: item.quantity.toString(),
        price: item.descuento ? item.descuento : item.precio,
        unit: item.unidad,
        descuento: item.descuento,
        precioRegular: item.precio
    })) || [];

    // Formatear fecha
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Verificar si el pedido puede ser cancelado
    const puedeCancelar = pedidoSeleccionado &&
        ['nuevo', 'proceso'].includes(pedidoSeleccionado.estado);

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
                        <a className='decoration-none cursor-pointer' href='/productos'>
                            <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                        </a>
                    </IonToolbar>
                </IonHeader>
                <div className="flex justify-center items-center min-h-screen">
                    <IonText>Cargando pedidos...</IonText>
                </div>
            </IonContent>
        );
    }

    if (pedidos.length === 0) {
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
                        <a className='decoration-none cursor-pointer' href='/productos'>
                            <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                        </a>
                    </IonToolbar>
                </IonHeader>

                <div className="flex flex-col justify-center items-center min-h-screen px-4 text-center">
                    <IconLiz fill="#7927F5" width={80} className="mb-4" />
                    <IonText className="text-lg font-semibold text-gray-700 mb-2">
                        No se encontraron pedidos
                    </IonText>
                    <IonText className="text-sm text-gray-500 mb-6">
                        Cuando realices un pedido, aparecerá aquí para que puedas seguir su estado.
                    </IonText>
                    <a
                        href="/productos"
                        className="group bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-yellow-500/25 transition-all hover:scale-105 hover:shadow-yellow-500/40 flex items-center gap-3 min-w-[200px] justify-center"
                    >
                        <ShoppingCart className="size-5" />
                        Comprar Ahora
                        <MoveRight className="size-5 group-hover:translate-x-1 transition-transform" />
                    </a>
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
                    <a className='decoration-none cursor-pointer' href='/productos'>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>

            <section className="py-1 px-4 max-w-6xl mx-auto min-h-screen my-16 md:my-6 space-y-5">
                {/* Selector de pedidos */}
                <div className="space-y-4">
                    <IonSegment value={segmentoActivo} onIonChange={e => setSegmentoActivo(e.detail.value as any)}>
                        <IonSegmentButton value="activos">
                            <IonText>Pedidos Activos</IonText>
                        </IonSegmentButton>
                        <IonSegmentButton value="todos">
                            <IonText>Todos los Pedidos</IonText>
                        </IonSegmentButton>
                    </IonSegment>

                    {/* Lista de pedidos */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {pedidosFiltrados.map(pedido => (
                            <IonCard
                                key={pedido.id}
                                className={`rounded-xl border cursor-pointer transition-all ${pedidoSeleccionado?.id === pedido.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200'
                                    }`}
                                onClick={() => setPedidoSeleccionado(pedido)}
                            >
                                <IonCardContent className="py-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <IonText className="font-semibold">Pedido #{pedido.id}</IonText>
                                            <IonText color="medium" className="block text-sm">
                                                {formatFecha(pedido.nombre_lista)}
                                            </IonText>
                                        </div>
                                        <div className="text-right">
                                            <IonBadge
                                                color={
                                                    pedido.estado === 'entregado' ? 'success' :
                                                        pedido.estado === 'cancelado' ? 'danger' :
                                                            pedido.estado === 'incompleto' ? 'warning' : 'primary'
                                                }
                                            >
                                                {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                                            </IonBadge>
                                            <IonText className="block font-bold text-lg text-purple-600">
                                                {formatValue(pedido.total, "currency")}
                                            </IonText>
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ))}
                    </div>
                </div>

                {pedidoSeleccionado && (
                    <>
                        {/* Encabezado del pedido seleccionado */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <IonCardTitle className="text-2xl md:text-4xl font-bold text-purple-900">
                                    Pedido #{pedidoSeleccionado.id}
                                </IonCardTitle>
                                <IonText color="medium">
                                    <p className="text-sm mt-1">Realizado el {formatFecha(pedidoSeleccionado.fecha_creacion)}</p>
                                </IonText>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 w-full md:w-auto">
                                {/* Botón para seguir comprando */}
                                <a
                                    href="/productos"
                                    className="group bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-6 py-3 rounded-2xl text-base shadow-2xl shadow-yellow-500/25 transition-all hover:scale-105 hover:shadow-yellow-500/40 flex items-center gap-2 justify-center"
                                >
                                    <ShoppingCart className="size-4" />
                                    Seguir Comprando
                                    <MoveRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                </a>

                                {/* Botón para cancelar pedido */}
                                {puedeCancelar && (
                                    <IonButton
                                        fill="outline"
                                        color="danger"
                                        onClick={() => setShowCancelAlert(true)}
                                        className="w-full sm:w-auto"
                                    >
                                        <IonIcon icon={closeCircle} slot="start" />
                                        Cancelar Pedido
                                    </IonButton>
                                )}
                            </div>
                        </div>

                        <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                            <IonCardHeader className="pb-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <IonBadge
                                        color={
                                            pedidoSeleccionado.estado === 'entregado' ? 'success' :
                                                pedidoSeleccionado.estado === 'cancelado' ? 'danger' :
                                                    pedidoSeleccionado.estado === 'incompleto' ? 'warning' : 'primary'
                                        }
                                        className="mt-2 md:mt-0 self-start"
                                    >
                                        {pedidoSeleccionado.estado.charAt(0).toUpperCase() + pedidoSeleccionado.estado.slice(1)}
                                    </IonBadge>
                                </div>

                                {/* Barra de progreso */}
                                <div className="relative mt-6">
                                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2" />
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-green-500 rounded-full -translate-y-1/2 transition-all duration-500"
                                        style={{ width: `${getProgressValue(getOrderStatus(pedidoSeleccionado)) * 100}%` }}
                                    />
                                    <div className="flex justify-between relative z-10">
                                        {getOrderStatus(pedidoSeleccionado).map((step, index) => (
                                            <div key={step.status} className="flex flex-col items-center flex-1 text-center">
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 text-sm md:text-xl mb-2 shadow-sm",
                                                        step.completed
                                                            ? "bg-green-500 border-green-500 text-white"
                                                            : step.active
                                                                ? "bg-purple-500 border-purple-500 text-white"
                                                                : "bg-white border-gray-300 text-gray-400"
                                                    )}
                                                >
                                                    {step.icon}
                                                </div>
                                                <p
                                                    className={cn(
                                                        "text-xs font-medium px-1",
                                                        step.active
                                                            ? "text-purple-700"
                                                            : step.completed
                                                                ? "text-green-600"
                                                                : "text-gray-400"
                                                    )}
                                                >
                                                    {step.status}
                                                </p>
                                                {step.time && (
                                                    <p className="text-[10px] md:text-[12px] text-gray-500 mt-1">{step.time}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </IonCardHeader>
                        </IonCard>

                        {/* BentoGrid */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Recoger en tienda */}
                            <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
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
                            <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
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
                                        <p>{formatValue(pedidoSeleccionado.total, "currency")}</p>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                                        <p className="font-bold text-lg">Total</p>
                                        <p className="font-bold text-xl text-purple-600">
                                            {formatValue(pedidoSeleccionado.total, "currency")}
                                        </p>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        </div>

                        {/* Productos del pedido */}
                        <div className="space-y-4">
                            <IonCard className="rounded-2xl border border-gray-200 shadow-sm bg-white">
                                <IonCardHeader>
                                    <IonCardTitle className="text-xl font-semibold">
                                        Productos del Pedido
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent className="space-y-4">
                                    {orderItems.length > 0 ? (
                                        orderItems.map(item => {
                                            const discountPercentage = calculateDiscountPercentage(item.precioRegular || item.price, item.descuento);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <IconLiz fill="#9CA3AF" width={32} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {item.quantity} {item.unit}
                                                            </p>
                                                            {/* Badge de descuento igual que en el card */}
                                                            {discountPercentage > 0 && (
                                                                <div className="w-fit mt-1 text-center border-2 bg-red-100 border-red-600 text-red-600 text-xs font-semibold px-2 py-1 rounded-md">
                                                                    -{discountPercentage}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {/* Precios igual que en el card */}
                                                        {item.descuento ? (
                                                            <>
                                                                <span className="text-base font-semibold text-purple-600 leading-none">
                                                                    {formatValue(item.descuento, "currency")}
                                                                </span>
                                                                <span className="text-[11px] text-gray-500 line-through leading-none">
                                                                    {formatValue(item.precioRegular || item.price, "currency")}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-base font-semibold text-purple-600 leading-none">
                                                                {formatValue(item.price, "currency")}
                                                            </span>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Total: {formatValue(item.price * parseInt(item.quantity), "currency")}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8">
                                            <IonText color="medium">No hay productos en este pedido</IonText>
                                        </div>
                                    )}
                                </IonCardContent>
                            </IonCard>
                        </div>
                    </>
                )}
            </section>
            <Footer />

            {/* Alert para confirmar cancelación */}
            <IonAlert
                isOpen={showCancelAlert}
                onDidDismiss={() => setShowCancelAlert(false)}
                header={'Cancelar Pedido'}
                message={'¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.'}
                buttons={[
                    {
                        text: 'No, mantener',
                        role: 'cancel',
                        cssClass: 'secondary'
                    },
                    {
                        text: 'Sí, cancelar',
                        role: 'confirm',
                        cssClass: 'danger',
                        handler: handleCancelarPedido
                    }
                ]}
            />
        </IonContent>
    );
};

export default Seguimiento;