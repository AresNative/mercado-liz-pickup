import Footer from "@/template/footer";
import { PageProps } from "@/utils/types/page";
import {
    IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonText, IonChip, IonBadge, IonIcon, IonSegment, IonSegmentButton,
    IonButton, IonAlert, IonNote, IonRow, IonCol, IonGrid,
    IonSkeletonText, IonLoading, IonItem, IonLabel,
    isPlatform
} from "@ionic/react";
import { IconLiz } from "../productos/components/ionc-liz";
import { cn } from "@/utils/functions/cn";
import {
    location, time, storefront,
    receipt, call, closeCircle,
    calendar, checkmarkCircle,
    car, bagCheck, alertCircle,
    checkmark, close, search,
    cube, checkbox, alert
} from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { useGetWithFiltersGeneralMutation, usePutGeneralMutation } from "@/hooks/reducers/api";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { formatValue } from "@/utils/constants/format-values";
import { ShoppingCart, MoveRight, AlertTriangle, Package, CheckCircle2, Clock, RefreshCw, XCircle, CheckCheck, Cuboid, MessageCircle } from "lucide-react";
import { usePedidosSignalR } from "./utils/signalr-pedidos";
import Sucursales from "../checkout/components/map";
import { ModalChat } from "./components/modal-chat";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import Card from "./components/card";

interface OrderStatus {
    status: string;
    completed: boolean;
    active: boolean;
    time?: string;
    description?: string;
    icon?: React.ReactNode;
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
    esServicio?: boolean;
    recolectado?: boolean;
    noEncontrado?: boolean;
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
    esServicio?: boolean;
    fecha_servicio?: string;
    hora_servicio?: string;
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
    fecha_cita?: string;
    hora_cita?: string;
    fecha_cita_obj?: Date | null;
    productos_recolectados?: number;
    productos_no_encontrados?: number;
    productos_totales?: number;
    porcentaje_recolectado?: number;
}

const Seguimiento: React.FC<PageProps> = ({ onScroll }: PageProps) => {

    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [segmentoActivo, setSegmentoActivo] = useState<'activos' | 'todos'>('activos');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [showNoPedidos, setShowNoPedidos] = useState(false);
    const [mostrarFiltroProductos, setMostrarFiltroProductos] = useState<'todos' | 'recolectados' | 'no_encontrados'>('todos');

    // Función mejorada para extraer fecha y hora de nombre_lista
    const extraerFechaHoraCita = (nombreLista: string): { fecha_cita: string, hora_cita: string, fecha_cita_obj: Date | null } => {
        try {
            const patrones = [
                /Pedido\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):\d{2}\.\d{3}/,
                /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):\d{2}\.\d{3}/,
                /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/,
                /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/
            ];

            for (const patron of patrones) {
                const match = nombreLista.match(patron);
                if (match) {
                    let fechaStr = match[1];
                    let horaStr = match[2];

                    if (fechaStr.includes('/')) {
                        const [day, month, year] = fechaStr.split('/');
                        fechaStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }

                    const fechaCitaObj = new Date(`${fechaStr}T${horaStr}:00`);

                    if (!isNaN(fechaCitaObj.getTime())) {
                        return {
                            fecha_cita: fechaStr,
                            hora_cita: horaStr,
                            fecha_cita_obj: fechaCitaObj
                        };
                    }
                }
            }

            return { fecha_cita: '', hora_cita: '', fecha_cita_obj: null };
        } catch (error) {
            console.error('Error extrayendo fecha/hora de cita:', error, nombreLista);
            return { fecha_cita: '', hora_cita: '', fecha_cita_obj: null };
        }
    };

    // Callbacks para SignalR
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log("Pedido actualizado via SignalR:", pedidoActualizado);

        setPedidos(prevPedidos => {
            const nuevosPedidos = prevPedidos.map(pedido =>
                pedido.id === pedidoActualizado.id
                    ? parseListaData(pedidoActualizado)
                    : pedido
            );

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
            return [pedidoProcesado, ...prevPedidos];
        });

        /* if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('¡Nuevo pedido recibido!', {
                body: `Pedido #${nuevoPedido.id} ha sido registrado`,
                icon: '/icon.png'
            });
        } */
    }, []);

    const handlePedidoBorrado = useCallback((idPedido: number) => {
        console.log("Pedido borrado via SignalR:", idPedido);

        setPedidos(prevPedidos => {
            const nuevosPedidos = prevPedidos.filter(pedido => pedido.id !== idPedido);

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

    // SignalR
    const { connection, isConnected, notificarCambioLista } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoBorrado,
        handleRefrescar
    );

    // Función para determinar el orderStatus
    const getOrderStatus = (pedido: Pedido): OrderStatus[] => {
        const fechaCreacion = new Date(pedido.fecha_creacion);
        const fechaActualizacion = new Date(pedido.fecha_actualizacion);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        };

        const iconStyle = "text-lg";

        const baseStatus: OrderStatus[] = [
            {
                status: "Confirmado",
                completed: true,
                time: formatTime(fechaCreacion),
                icon: <IonIcon icon={checkmarkCircle} className={iconStyle} />,
                description: "Tu pedido ha sido recibido",
                active: true
            },
            {
                status: "Preparando",
                completed: ['proceso', 'listo', 'entregado'].includes(pedido.estado),
                time: ['proceso', 'listo', 'entregado'].includes(pedido.estado) ?
                    formatTime(fechaActualizacion) : undefined,
                icon: <IonIcon icon={bagCheck} className={iconStyle} />,
                description: "Armando tu pedido",
                active: ['proceso', 'listo', 'entregado'].includes(pedido.estado)
            },
            {
                status: "Listo",
                completed: ['listo', 'entregado'].includes(pedido.estado),
                time: ['listo', 'entregado'].includes(pedido.estado) ?
                    formatTime(fechaActualizacion) : undefined,
                icon: <IonIcon icon={car} className={iconStyle} />,
                description: "Listo para recoger",
                active: ['listo', 'entregado'].includes(pedido.estado),
            },
            {
                status: "Entregado",
                completed: pedido.estado === 'entregado',
                time: pedido.estado === 'entregado' ? formatTime(fechaActualizacion) : undefined,
                icon: <IonIcon icon={checkmarkCircle} className={iconStyle} />,
                description: pedido.estado === 'entregado' ? "¡Entregado con éxito!" : "Esperando recogida",
                active: pedido.estado === 'entregado'
            },
        ];

        if (pedido.estado === 'cancelado' || pedido.estado === 'incompleto') {
            return baseStatus.map(status => ({
                ...status,
                completed: status.status === "Confirmado",
                active: status.status === "Confirmado",
                icon: status.status === "Confirmado" ?
                    <IonIcon icon={checkmarkCircle} className={iconStyle} /> :
                    <IonIcon icon={closeCircle} className={iconStyle} />,
                description: pedido.estado === 'cancelado' ? "Pedido cancelado" : "Pedido incompleto"
            }));
        }

        return baseStatus;
    };

    const getStoreInfo = (pedido: Pedido) => {
        const sucursales = {
            1: { store: "Sucursal Mayoreo", address: "Calle Principal 216, 22750", phone: "+52 (646) 155 2258" },
            2: { store: "Sucursal Centro", address: "Av. Central 123, 22740", phone: "+52 (646) 155 2259" },
            default: { store: "Sucursal Mayoreo", address: "Calle Principal 216, 22750", phone: "+52 (646) 155 2258" }
        };

        const sucursal = sucursales[pedido.sucursal_id as keyof typeof sucursales] || sucursales.default;

        let schedule = "Horario flexible";
        if (pedido.fecha_cita && pedido.hora_cita) {
            schedule = `${formatFechaCita(pedido.fecha_cita)}, ${pedido.hora_cita}`;
        }

        return {
            store: sucursal.store,
            address: sucursal.address,
            schedule,
            phone: sucursal.phone,
            estimatedTime: pedido.tiempo_restante !== undefined && pedido.tiempo_restante > 0 ?
                `${Math.max(0, pedido.tiempo_restante)} min` :
                "15-20 min",
        };
    };

    const getProgressValue = (orderStatus: OrderStatus[]) => {
        const completed = orderStatus.filter(s => s.completed).length;
        return completed / orderStatus.length;
    };

    const handleCancelarPedido = async () => {
        if (!pedidoSeleccionado) return;

        try {
            await putGeneral({
                table: "listas",
                data: {
                    Data: {
                        estado: 'cancelado',
                        fecha_actualizacion: new Date().toISOString()
                    },
                    Filtros: [
                            {
                                "Key": "ID",
                                "Value": pedidoSeleccionado.id,
                                "Operator": "="
                            }
                        ],
                },
            }).unwrap();

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                estado: 'cancelado',
                fecha_actualizacion: new Date().toISOString()
            } : null);

            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoSeleccionado.id
                    ? { ...pedido, estado: 'cancelado', fecha_actualizacion: new Date().toISOString() }
                    : pedido
            ));

            console.log(`Pedido #${pedidoSeleccionado.id} cancelado exitosamente`);

            if (isConnected && connection) {
                await notificarCambioLista("updated", pedidoSeleccionado);
            }

        } catch (error) {
            console.error("Error cancelando pedido:", error);
        } finally {
            setShowCancelAlert(false);
        }
    };

    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let total = 0;
        let productosRecolectados = 0;
        let productosNoEncontrados = 0;
        let productosTotales = 0;

        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                total = items.reduce((sum, item) => {
                    const precioFinal = item.descuento ? item.descuento : item.precio;
                    return sum + (precioFinal * item.quantity);
                }, 0);

                // Calcular estadísticas de productos
                productosTotales = items.filter((item: ListaItem) => !item.esServicio).length;
                productosRecolectados = items.filter((item: ListaItem) =>
                    !item.esServicio && item.recolectado === true
                ).length;
                productosNoEncontrados = items.filter((item: ListaItem) =>
                    !item.esServicio && item.noEncontrado === true
                ).length;
            }
        } catch (error) {
            console.error('Error parsing array_lista:', error);
            items = [];
        }

        // Extraer fecha y hora de la cita
        const { fecha_cita, hora_cita, fecha_cita_obj } = extraerFechaHoraCita(lista.nombre_lista);

        const calcularUrgencia = (): { urgencia: 'alta' | 'media' | 'baja', tiempo_restante: number } => {
            if (lista.estado !== 'nuevo' && lista.estado !== 'proceso') {
                return { urgencia: 'baja', tiempo_restante: 0 };
            }

            if (!fecha_cita || !hora_cita || !fecha_cita_obj) {
                return { urgencia: 'baja', tiempo_restante: 0 };
            }

            const ahora = new Date();
            const diferenciaMs = fecha_cita_obj.getTime() - ahora.getTime();
            const minutosRestantes = Math.floor(diferenciaMs / (1000 * 60));

            if (minutosRestantes < 0) {
                return { urgencia: 'alta', tiempo_restante: 0 };
            }

            let urgencia: 'alta' | 'media' | 'baja' = 'baja';
            if (minutosRestantes <= 30) urgencia = 'alta';
            else if (minutosRestantes <= 120) urgencia = 'media';

            return { urgencia, tiempo_restante: minutosRestantes };
        };

        const { urgencia, tiempo_restante } = calcularUrgencia();

        const porcentajeRecolectado = productosTotales > 0 ?
            (productosRecolectados / productosTotales) * 100 : 0;

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
            tiempo_restante,
            fecha_cita,
            hora_cita,
            fecha_cita_obj,
            productos_recolectados: productosRecolectados,
            productos_no_encontrados: productosNoEncontrados,
            productos_totales: productosTotales,
            porcentaje_recolectado: Math.round(porcentajeRecolectado)
        };
    }

    const fetchPedidos = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) setRefreshing(true);

        try {
            const userId = getLocalStorageItem("user-id");
            if (!userId) {
                console.error("User ID not found in local storage");
                setLoading(false);
                setRefreshing(false);
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
                    { key: "listas.sucursal_id" },
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

                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const estadosActivos = ['nuevo', 'proceso', 'listo'];
                    const esAActivo = estadosActivos.includes(a.estado);
                    const esBActivo = estadosActivos.includes(b.estado);

                    if (esAActivo && !esBActivo) return -1;
                    if (!esAActivo && esBActivo) return 1;

                    if (esAActivo && esBActivo) {
                        const ordenUrgencia = { alta: 0, media: 1, baja: 2 };
                        const urgenciaA = ordenUrgencia[a.urgencia || 'baja'];
                        const urgenciaB = ordenUrgencia[b.urgencia || 'baja'];
                        if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

                        if (a.tiempo_restante !== b.tiempo_restante) {
                            return (a.tiempo_restante || 9999) - (b.tiempo_restante || 9999);
                        }
                    }

                    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                });

                setPedidos(pedidosOrdenados);
                if (pedidosOrdenados.length > 0 && (!pedidoSeleccionado || forceRefresh)) {
                    setPedidoSeleccionado(pedidosOrdenados[0]);
                }
                setShowNoPedidos(false);
            } else {
                console.log("No se encontraron pedidos para este cliente");
                setPedidos([]);
                setPedidoSeleccionado(null);
                setShowNoPedidos(true);
            }
        } catch (error) {
            console.error("Error fetching pedidos:", error);
            setPedidos([]);
            setPedidoSeleccionado(null);
            setShowNoPedidos(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getWithFilter]);

    useEffect(() => {
        fetchPedidos();

        /* if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        } */
    }, []);

    useEffect(() => {
        if (isConnected) {
            console.log("✅ SignalR conectado - Escuchando actualizaciones en tiempo real");
        }
    }, [isConnected]);

    // Filtrar pedidos según el segmento activo
    const pedidosFiltrados = segmentoActivo === 'activos'
        ? pedidos.filter(pedido => ['nuevo', 'proceso', 'listo'].includes(pedido.estado))
        : pedidos;

    // Convertir items del pedido al formato OrderItem
    const orderItems: any[] = pedidoSeleccionado?.items?.map(item => item) || [];

    // Formatear fecha
    const formatFecha = (fecha: string) => {
        const date = new Date(fecha);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);

        if (date.toDateString() === hoy.toDateString()) {
            return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === ayer.toDateString()) {
            return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const formatFechaCita = (fecha: string) => {
        const date = new Date(fecha);
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        if (date.toDateString() === hoy.toDateString()) {
            return "Hoy";
        } else if (date.toDateString() === manana.toDateString()) {
            return "Mañana";
        } else {
            return date.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
        }
    };

    // Verificar si el pedido puede ser cancelado
    const puedeCancelar = pedidoSeleccionado &&
        ['nuevo', 'proceso'].includes(pedidoSeleccionado.estado);

    // Separar productos de servicios
    const productos = orderItems.filter(item => !item.esServicio);

    const dispatch = useAppDispatch();
    const handleOpenChat = (pedido: Pedido) => {
        dispatch(openModalReducer({ modalName: `chat_${pedido.cliente_telefono}_${pedido.id}` }));
    };

    // Filtrar productos según el estado seleccionado
    const productosFiltrados = productos.filter(producto => {
        if (mostrarFiltroProductos === 'recolectados') return producto.recolectado === true;
        if (mostrarFiltroProductos === 'no_encontrados') return producto.noEncontrado === true;
        return true; // 'todos'
    });

    // Estadísticas del pedido seleccionado
    const getEstadisticasPedido = () => {
        if (!pedidoSeleccionado) return null;

        return {
            recolectados: pedidoSeleccionado.productos_recolectados || 0,
            noEncontrados: pedidoSeleccionado.productos_no_encontrados || 0,
            total: pedidoSeleccionado.productos_totales || 0,
            porcentaje: pedidoSeleccionado.porcentaje_recolectado || 0
        };
    };

    const estadisticas = getEstadisticasPedido();

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <IonCard key={i} className="rounded-xl">
                    <IonCardContent className="py-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <IonSkeletonText animated style={{ width: '40%', height: '20px' }} />
                                <IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
                                <IonSkeletonText animated style={{ width: '30%', height: '14px' }} />
                            </div>
                            <div className="space-y-2">
                                <IonSkeletonText animated style={{ width: '80px', height: '24px' }} />
                                <IonSkeletonText animated style={{ width: '60px', height: '14px' }} />
                            </div>
                        </div>
                    </IonCardContent>
                </IonCard>
            ))}
        </div>
    );

    return (
        <>
            {pedidoSeleccionado && pedidosFiltrados && pedidosFiltrados.map(pedido => <ModalChat telefonoClient={pedido.cliente_telefono || 'general'} pedido={pedido} />)}
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 10;
                onScroll?.(isScrolled);
            }}>

            <IonHeader collapse="condense" className="custom-toolbar-clear h-fit absolute top-0">
                <IonToolbar>
                    <div className="flex items-center justify-between px-2">
                        <a className='decoration-none cursor-pointer' href='/productos'>
                            <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                        </a>
                        <div className="flex items-center gap-2">
                            <IonButton
                                fill="clear"
                                size="small"
                                onClick={() => fetchPedidos(true)}
                                disabled={refreshing}
                            >
                                <IonIcon icon={refreshing ? "sync" : "refresh"} className={refreshing ? "animate-spin" : ""} />
                            </IonButton>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <section className="py-1 px-3 sm:px-4 max-w-6xl mx-auto min-h-screen md:my-6 space-y-5">
                {/* Header responsive */}
                <div className="z-10 bg-white pb-2 pt-4 -mx-3 px-3 sm:static sm:top-auto sm:bg-transparent sm:pb-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Pedidos</h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {pedidosFiltrados.length} {segmentoActivo === 'activos' ? 'activos' : 'totales'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <IonSegment
                                value={segmentoActivo}
                                onIonChange={e => setSegmentoActivo(e.detail.value as any)}
                                className="segment-responsive"
                            >
                                <IonSegmentButton value="activos" className="text-xs sm:text-sm">
                                    <span className="hidden xs:inline">Activos</span>
                                    <span className="xs:hidden">Activos</span>
                                </IonSegmentButton>
                                <IonSegmentButton value="todos" className="text-xs sm:text-sm">
                                    <span className="hidden xs:inline">Todos</span>
                                    <span className="xs:hidden">Todos</span>
                                </IonSegmentButton>
                            </IonSegment>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingSkeleton />
                ) : showNoPedidos ? (
                    <div className="flex flex-col justify-center items-center min-h-[60vh] px-4 text-center">
                        <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mb-6">
                            <IconLiz fill="#7927F5" width={48} />
                        </div>
                        <IonText className="text-lg font-semibold text-gray-700 mb-2">
                            No tienes pedidos aún
                        </IonText>
                        <IonText className="text-sm text-gray-500 mb-6 text-center max-w-md">
                            Cuando realices un pedido, aparecerá aquí para que puedas seguir su estado en tiempo real.
                        </IonText>
                        <a
                            href="/productos"
                            className="group bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-6 py-3 rounded-xl text-base shadow-lg shadow-yellow-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 justify-center"
                        >
                            <ShoppingCart className="size-4" />
                            <span className="hidden sm:inline">Explorar Productos</span>
                            <span className="sm:hidden">Comprar</span>
                            <MoveRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Lista de pedidos - Mobile swipeable */}
                        <div className="md:hidden">
                            <div className="overflow-x-auto pb-2 -mx-3 px-3">
                                <div className="flex space-x-3" style={{ minWidth: 'max-content' }}>
                                    {pedidosFiltrados.map(pedido => {
                                        const storeInfo = getStoreInfo(pedido);
                                        const orderStatus = getOrderStatus(pedido);
                                        const progress = getProgressValue(orderStatus);

                                        return (
                                            <div
                                                key={pedido.id}
                                                className={`flex-shrink-0 w-72 rounded-xl border cursor-pointer transition-all ${pedidoSeleccionado?.id === pedido.id
                                                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                                                    : 'border-gray-200 bg-white'
                                                    }`}
                                                onClick={() => setPedidoSeleccionado(pedido)}
                                            >
                                                <IonCardContent className="py-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <IonText className="font-bold text-gray-900">#{pedido.id}</IonText>
                                                            <IonBadge
                                                                color={
                                                                    pedido.estado === 'entregado' ? 'success' :
                                                                        pedido.estado === 'cancelado' ? 'danger' :
                                                                            pedido.estado === 'incompleto' ? 'warning' :
                                                                                pedido.urgencia === 'alta' ? 'danger' :
                                                                                    pedido.urgencia === 'media' ? 'warning' : 'primary'
                                                                }
                                                                className="ml-2 text-xs"
                                                            >
                                                                {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                                                            </IonBadge>
                                                        </div>
                                                        <IonText className="font-bold text-purple-600">
                                                            {formatValue(pedido.total, "currency")}
                                                        </IonText>
                                                    </div>

                                                    {/* Barra de progreso mini */}
                                                    <div className="relative h-1 bg-gray-100 rounded-full mb-3">
                                                        <div
                                                            className="absolute left-0 h-full bg-gradient-to-r from-emerald-600 to-green-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${progress * 100}%` }}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        {pedido.fecha_cita && (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <IonIcon icon={calendar} className="text-purple-600" />
                                                                <IonText className="text-gray-600">
                                                                    {formatFechaCita(pedido.fecha_cita)} {pedido.hora_cita}
                                                                </IonText>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <IonIcon icon={storefront} className="text-gray-400" />
                                                            <IonText className="text-gray-500 truncate">
                                                                {storeInfo.store}
                                                            </IonText>
                                                        </div>
                                                    </div>

                                                    {/* Indicadores de recolección */}
                                                    {pedido.productos_totales && pedido.productos_totales > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1">
                                                                    <Cuboid className="size-3 text-gray-500" />
                                                                    <IonText className="text-xs text-gray-600">
                                                                        Recolectado:
                                                                    </IonText>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <IonChip
                                                                        color={pedido.porcentaje_recolectado === 100 ? 'success' : 'warning'}
                                                                        className="text-xs h-5"
                                                                    >
                                                                        {pedido.productos_recolectados}/{pedido.productos_totales}
                                                                    </IonChip>
                                                                    {Number(pedido.productos_no_encontrados) > 0 && (
                                                                        <IonBadge color="danger" className="text-xs">
                                                                            {pedido.productos_no_encontrados} no encontrado (s)
                                                                        </IonBadge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </IonCardContent>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Lista de pedidos - Desktop */}
                        <div className="hidden md:block space-y-2 max-h-80 overflow-y-auto pr-2">
                            {pedidosFiltrados.map(pedido => {
                                const storeInfo = getStoreInfo(pedido);

                                return (
                                    <IonCard
                                        key={pedido.id}
                                        className={`rounded-xl border cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${pedidoSeleccionado?.id === pedido.id
                                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                                            : 'border-gray-200 hover:border-purple-300'
                                            }`}
                                        onClick={() => setPedidoSeleccionado(pedido)}
                                    >
                                        <IonCardContent className="py-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <IonText className="font-bold text-gray-900">Pedido #{pedido.id}</IonText>
                                                        <IonBadge
                                                            color={
                                                                pedido.estado === 'entregado' ? 'success' :
                                                                    pedido.estado === 'cancelado' ? 'danger' :
                                                                        pedido.estado === 'incompleto' ? 'warning' :
                                                                            pedido.urgencia === 'alta' ? 'danger' :
                                                                                pedido.urgencia === 'media' ? 'warning' : 'primary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                                                            {pedido.urgencia === 'alta' && ' ⚠️'}
                                                        </IonBadge>
                                                    </div>

                                                    {pedido.fecha_cita && pedido.hora_cita && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <IonIcon icon={calendar} className="text-purple-600 text-sm" />
                                                            <IonText className="text-sm text-gray-600">
                                                                {formatFechaCita(pedido.fecha_cita)} a las {pedido.hora_cita}
                                                            </IonText>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Package className="size-3" />
                                                            <span>{pedido.productos_totales || 0} productos</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <IonIcon icon={storefront} className="text-sm" />
                                                            <span>{storeInfo.store}</span>
                                                        </div>
                                                    </div>

                                                    {/* Estadísticas de recolección */}
                                                    {pedido.productos_totales && pedido.productos_totales > 0 && (
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="flex items-center gap-1">
                                                                <IonBadge color={pedido.porcentaje_recolectado === 100 ? 'success' : 'warning'} className="text-xs">
                                                                    <IonIcon icon={cube} className="mr-1" />
                                                                    {pedido.productos_recolectados || 0}/{pedido.productos_totales} recogidos
                                                                </IonBadge>
                                                            </div>
                                                            {Number(pedido.productos_no_encontrados) > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <IonBadge color="danger" className="text-xs">
                                                                        {pedido.productos_no_encontrados || ""} no encontrado (s)
                                                                    </IonBadge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right">
                                                    <IonText className="block font-bold text-lg text-purple-600">
                                                        {formatValue(pedido.total, "currency")}
                                                    </IonText>
                                                    <IonNote className="text-xs text-gray-500 block mt-1">
                                                        {formatFecha(pedido.fecha_creacion)}
                                                    </IonNote>
                                                </div>
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                );
                            })}
                        </div>

                        {pedidoSeleccionado && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Encabezado del pedido seleccionado */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <IonCardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">
                                                Pedido #{pedidoSeleccionado.id}
                                            </IonCardTitle>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <IonBadge
                                                    color={
                                                        pedidoSeleccionado.estado === 'entregado' ? 'success' :
                                                            pedidoSeleccionado.estado === 'cancelado' ? 'danger' :
                                                                pedidoSeleccionado.estado === 'incompleto' ? 'warning' :
                                                                    pedidoSeleccionado.urgencia === 'alta' ? 'danger' :
                                                                        pedidoSeleccionado.urgencia === 'media' ? 'warning' : 'primary'
                                                    }
                                                    className="text-sm"
                                                >
                                                    {pedidoSeleccionado.estado.charAt(0).toUpperCase() + pedidoSeleccionado.estado.slice(1)}
                                                </IonBadge>

                                                {pedidoSeleccionado.fecha_cita && pedidoSeleccionado.hora_cita && (
                                                    <IonChip color="medium" className="text-sm">
                                                        <IonIcon icon={calendar} slot="start" />
                                                        {formatFechaCita(pedidoSeleccionado.fecha_cita)} {pedidoSeleccionado.hora_cita}
                                                    </IonChip>
                                                )}
                                            </div>
                                        </div>
                                        <IonText color="medium" className="text-sm">
                                            Realizado {formatFecha(pedidoSeleccionado.fecha_creacion)}
                                        </IonText>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-3 md:mt-0">
                                        {puedeCancelar && (
                                            <IonButton
                                                fill="outline"
                                                color="danger"
                                                size="small"
                                                onClick={() => setShowCancelAlert(true)}
                                                className="w-full sm:w-auto"
                                            >
                                                <IonIcon icon={closeCircle} slot="start" />
                                                <span className="hidden sm:inline">Cancelar</span>
                                                <span className="sm:hidden">Cancelar Pedido</span>
                                            </IonButton>
                                        )}

                                        <a
                                            href="/productos"
                                            className="group bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-yellow-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 justify-center"
                                        >
                                            <ShoppingCart className="size-4" />
                                            <span className="hidden sm:inline">Nueva Compra</span>
                                            <span className="sm:hidden">Comprar</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Barra de progreso responsive */}
                                <IonCard className="rounded-xl border border-gray-200 shadow-sm bg-white">
                                    <IonCardHeader className="pb-4">
                                        <div className="relative mt-2">
                                            <div className="absolute top-1/2 left-0 right-0 h-1.5 sm:h-2 bg-gray-100 rounded-full -translate-y-1/2" />
                                            <div
                                                className="absolute top-1/2 left-0 h-1.5 sm:h-2 bg-gradient-to-r from-emerald-600 to-green-500 rounded-full -translate-y-1/2 transition-all duration-700"
                                                style={{ width: `${getProgressValue(getOrderStatus(pedidoSeleccionado)) * 100}%` }}
                                            />
                                            <div className="flex justify-between relative z-10 px-1 sm:px-0">
                                                {getOrderStatus(pedidoSeleccionado).map((step, index) => (
                                                    <div key={step.status} className="flex flex-col items-center flex-1 text-center max-w-[70px] sm:max-w-none">
                                                        <div
                                                            className={cn(
                                                                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 sm:border-3 text-sm sm:text-lg mb-2 shadow-sm transition-all",
                                                                step.completed
                                                                    ? "bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white shadow-green-500/25"
                                                                    : step.active
                                                                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-emerald-500/25 animate-pulse"
                                                                        : "bg-white border-gray-300 text-gray-400"
                                                            )}
                                                        >
                                                            {step.icon}
                                                        </div>
                                                        <p
                                                            className={cn(
                                                                "text-xs font-bold px-1 mt-8 truncate w-full",
                                                                step.active
                                                                    ? "text-purple-700"
                                                                    : step.completed
                                                                        ? "text-green-600"
                                                                        : "text-gray-400"
                                                            )}
                                                        >
                                                            {step.status}
                                                        </p>
                                                        {step.description && (
                                                            <p className="text-[10px] text-gray-500 truncate w-full">
                                                                {step.description}
                                                            </p>
                                                        )}
                                                        {step.time && (
                                                            <p className="text-[10px] font-medium text-gray-600 mt-0.5">{step.time}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </IonCardHeader>
                                </IonCard>

                                {/* Grid de información responsive con estadísticas */}
                                <IonGrid className="px-0 gap-2">
                                    <IonRow>
                                        <IonCol size="12" sizeMd="8">
                                            <IonCard className="rounded-xl border border-gray-200 shadow-sm bg-white h-full">
                                                <IonCardHeader>
                                                    <IonCardTitle className="flex items-center text-base sm:text-lg font-semibold">
                                                        <IonIcon icon={location} className="mr-2 text-purple-600" />
                                                        Recoger en Tienda
                                                    </IonCardTitle>
                                                </IonCardHeader>
                                                <IonCardContent className="space-y-4">
                                                    <div className="flex items-start space-x-3">
                                                        <IonIcon icon={storefront} className="text-purple-600 mt-1 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{getStoreInfo(pedidoSeleccionado).store}</p>
                                                            <p className="text-sm text-gray-500">{getStoreInfo(pedidoSeleccionado).address}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start space-x-3">
                                                        <IonIcon icon={calendar} className="text-purple-600 mt-1 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">Horario de Recogida</p>
                                                            <p className="text-sm text-gray-500">{getStoreInfo(pedidoSeleccionado).schedule}</p>
                                                            {pedidoSeleccionado.tiempo_restante !== undefined && pedidoSeleccionado.tiempo_restante > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    <IonChip
                                                                        color={pedidoSeleccionado.urgencia === 'alta' ? 'danger' : pedidoSeleccionado.urgencia === 'media' ? 'warning' : 'success'}
                                                                        className="text-xs h-6"
                                                                    >
                                                                        <Clock className="mr-1 size-3" />
                                                                        {pedidoSeleccionado.tiempo_restante} min
                                                                    </IonChip>
                                                                    {pedidoSeleccionado.urgencia === 'alta' && (
                                                                        <IonChip color="danger" className="text-xs h-6">
                                                                            <AlertTriangle className="mr-1 size-3" />
                                                                            ¡Urgente!
                                                                        </IonChip>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start space-x-3">
                                                        <IonIcon icon={call} className="text-purple-600 mt-1 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">Contacto</p>
                                                            <p className="text-sm text-gray-500">{getStoreInfo(pedidoSeleccionado).phone}</p>
                                                        </div>
                                                            </div>

                                                            <Sucursales sucursalVista="(Precio Lista)" />
                                                </IonCardContent>
                                            </IonCard>
                                        </IonCol>

                                        <IonCol size="12" sizeMd="4">
                                            <IonCard className="shadow-none bg-transparent h-full">
                                                <IonCardHeader>
                                                    <IonCardTitle className="flex items-center text-base sm:text-lg font-semibold">
                                                        <IonIcon icon={cube} className="mr-2 text-purple-600" />
                                                        Estado de Recolección
                                                    </IonCardTitle>
                                                </IonCardHeader>
                                                <IonCardContent className="space-y-4">
                                                    {/* Barra de progreso de recolección */}
                                                    <ul className="h-full">
                                                        <li className="flex justify-between items-center mb-2">
                                                            <IonText className="text-sm font-semibold text-gray-700">
                                                                Productos recolectados
                                                            </IonText>
                                                            <IonText className="text-sm font-bold text-purple-600">
                                                                {estadisticas?.porcentaje || 0}%
                                                            </IonText>
                                                        </li>
                                                        <li className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                                                style={{ width: `${estadisticas?.porcentaje || 0}%` }}
                                                            />
                                                        </li>
                                                        <li className="flex justify-between mt-1">
                                                            <IonText className="text-xs text-gray-500">
                                                                {estadisticas?.recolectados || 0} de {estadisticas?.total || 0}
                                                            </IonText>
                                                        </li>
                                                    </ul>

                                                    {/* Estadísticas detalladas */}
                                                    <ul className="relative space-y-3">
                                                        <li className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                                <IonText className="text-sm text-gray-700">Recolectados</IonText>
                                                            </div>
                                                            <IonBadge color="success">
                                                                {estadisticas?.recolectados || 0}
                                                            </IonBadge>
                                                        </li>

                                                        <li className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                                <IonText className="text-sm text-gray-700">No encontrados</IonText>
                                                            </div>
                                                            <IonBadge color="danger">
                                                                {estadisticas?.noEncontrados || 0}
                                                            </IonBadge>
                                                        </li>

                                                        <li className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                                                <IonText className="text-sm text-gray-700">Pendientes</IonText>
                                                            </div>
                                                            <IonBadge color="medium">
                                                                {Math.max(0, (estadisticas?.total || 0) - (estadisticas?.recolectados || 0) - (estadisticas?.noEncontrados || 0))}
                                                            </IonBadge>
                                                        </li>
                                                                
                                                        <li>
                                                            <div className="flex items-center gap-2 bottom-0"> 
                                                                Contactar a soloporte:                
                                                                <button
                                                                    onClick={() => handleOpenChat(pedidoSeleccionado)}
                                                                    className="text-purple-600 bg-purple-200 p-2 rounded-full hover:text-purple-900 transition-colors"
                                                                    title={`Abrir chat con ${pedidoSeleccionado.nombre || 'cliente'}`}
                                                                >
                                                                    <MessageCircle className="h-4 w-4" />
                                                                </button>        
                                                            </div>
                                                        </li>
                                                    </ul>
                                                            
                                                </IonCardContent>
                                            </IonCard>
                                        </IonCol>
                                        
                                        <IonCol size="12" sizeMd="12">
                                            <IonCard className="rounded-xl border border-gray-200 shadow-sm bg-white">
                                                <IonCardHeader>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <IonCardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                                            <Package className="size-4 sm:size-5" />
                                                            Productos ({productos.length})
                                                            {estadisticas && (
                                                                <div className="flex items-center gap-2 ml-2">
                                                                    <IonBadge color="success" className="text-xs">
                                                                        <IonIcon icon={checkmark} className="mr-1" />
                                                                        {estadisticas.recolectados}
                                                                    </IonBadge>
                                                                    <IonBadge color="danger" className="text-xs">
                                                                        <IonIcon icon={close} className="mr-1" />
                                                                        {estadisticas.noEncontrados}
                                                                    </IonBadge>
                                                                </div>
                                                            )}
                                                        </IonCardTitle>

                                                        <IonSegment
                                                            value={mostrarFiltroProductos}
                                                            onIonChange={e => setMostrarFiltroProductos(e.detail.value as any)}
                                                            className="segment-responsive text-xs"
                                                        >
                                                            <IonSegmentButton value="todos" className="text-xs">
                                                                Todos
                                                            </IonSegmentButton>
                                                            <IonSegmentButton value="recolectados" className="text-xs">
                                                                Recolectados
                                                            </IonSegmentButton>
                                                            <IonSegmentButton value="no_encontrados" className="text-xs">
                                                                No encontrados
                                                            </IonSegmentButton>
                                                        </IonSegment>
                                                    </div>
                                                </IonCardHeader>
                                                <IonCardContent className="space-y-3">
                                                    {productosFiltrados.length > 0 ? (
                                                        productosFiltrados.map(item =>  <Card producto={item} key={item.id} />)
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <IonIcon icon={search} className="text-gray-400 text-2xl" />
                                                            </div>
                                                            <IonText color="medium" className="block mb-2">
                                                                No hay productos {mostrarFiltroProductos === 'recolectados' ? 'recolectados' : mostrarFiltroProductos === 'no_encontrados' ? 'no encontrados' : ''}
                                                            </IonText>
                                                            {mostrarFiltroProductos !== 'todos' && (
                                                                <IonButton
                                                                    size="small"
                                                                    fill="clear"
                                                                    onClick={() => setMostrarFiltroProductos('todos')}
                                                                >
                                                                    Mostrar todos los productos
                                                                </IonButton>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <section className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                                                        <span>Total:</span>
                                                        <p className="font-bold text-xl sm:text-2xl text-purple-600 right-0">
                                                            {formatValue(pedidoSeleccionado.total, "currency")}
                                                        </p>
                                                    </section>
                                                </IonCardContent>
                                            </IonCard>
                                        </IonCol>
                                    </IonRow>

                                </IonGrid>

                                {/* Productos del pedido con filtros */}

                            </div>
                        )}
                    </>
                )}
            </section>

            <section className="md:mb-0 mb-12">
                <Footer />
            </section>

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

                <IonLoading isOpen={refreshing} message="Actualizando pedidos..." />
            </IonContent>
        </>
    );
};

export default Seguimiento;
