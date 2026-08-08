import {
    IonCard,
    IonCardContent,
    IonInput,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonBackButton,
    IonAlert,
    IonLoading,
    IonBadge,
    IonChip,
    IonProgressBar,
    IonSkeletonText,
    isPlatform,
    IonButtons,
    IonModal,
    IonTitle,
    useIonAlert
} from "@ionic/react";
import { useState, useEffect } from "react";
import {
    User, Mail, Phone, Calendar, IdCard,
    Package, TrendingDown, Edit2, Save, X,
    Sparkles, Box, DollarSign, Award,
    CalendarDays, BarChart3, ChevronRight,
    Shield, CreditCard, History, Star
} from "lucide-react";
import { PageProps } from "@/utils/types/page";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { useHistory } from "react-router";
import { formatValue } from '@/utils/constants/format-values';

// API hooks
import {
    useGetWithFiltersGeneralMutation,
    usePutMutation
} from "@/hooks/reducers/api";

// Auth hooks
import {
    useLogoutUserMutation
} from "@/hooks/reducers/auth";

// Local storage utils
import {
    getLocalStorageItem,
    setLocalStorageItem
} from "@/utils/functions/local-storage";
import { safeCall } from "@/hooks/use-debounce";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Badge from "@/components/badge";
import { cn } from "@/utils/functions/cn";
import MainForm from "@/components/form/main-form";
import { LogInField } from "@/utils/constants/forms/logIn";

interface UserData {
    id?: string;
    usuario_id?: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    rol?: string;
    fecha_registro?: string;
    [key: string]: any;
}

interface ResumenData {
    totalAhorro: string;
    totalPedidos: number;
    fechasMasSolicitadas: Array<{ fecha: string; pedidos: number }>;
    pedidosPorEstado: Record<string, number>;
    promedioPedidosPorDia?: number;
}

const PerfilPage: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    const [getDataUserPerfil] = useGetWithFiltersGeneralMutation();
    const [putDataUserPerfil] = usePutMutation();
    const [logoutUser] = useLogoutUserMutation();

    const [dataUser, setDataUser] = useState<UserData>({});
    const [resumen, setResumen] = useState<ResumenData>({
        totalAhorro: "0",
        totalPedidos: 0,
        fechasMasSolicitadas: [],
        pedidosPorEstado: {}
    });
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [tempUserData, setTempUserData] = useState<UserData>({});
    const history = useHistory();

    const [LogOutProces] = useLogoutUserMutation()
    const [presentAlert] = useIonAlert();

    const userRole = getLocalStorageItem("user-role");
    const userId = getLocalStorageItem("user-id");
    const user = getLocalStorageItem("token");

    const logout = async () => {
        if (!userId) {
            console.error("No user ID found");
            return;
        }

        try {
            await LogOutProces(userId).unwrap(); // ✅ Envía solo el ID
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
    const [isOpen, setIsOpen] = useState(false);
    // Función para calcular nivel de usuario
    const calcularNivel = (totalPedidos: number) => {
        if (totalPedidos >= 50) return { nivel: "Élite", color: "from-purple-600 to-pink-600", icon: <Award className="size-5" /> };
        if (totalPedidos >= 20) return { nivel: "Avanzado", color: "from-blue-600 to-purple-600", icon: <Star className="size-5" /> };
        if (totalPedidos >= 5) return { nivel: "Intermedio", color: "from-green-600 to-blue-600", icon: <Star className="size-5" /> };
        return { nivel: "Principiante", color: "from-gray-600 to-gray-400", icon: <User className="size-5" /> };
    };

    const nivelUsuario = calcularNivel(resumen.totalPedidos);

    async function fetchUserData() {
        setLoading(true);
        try {
            const userId = getLocalStorageItem("user-id");

            const existingUser = await safeCall(() => getDataUserPerfil({
                table: "usuarios",
                filtros: {
                    Filtros: [{ key: "id", operator: "=", value: userId }],
                    Order: [{ Key: "id", Direction: "Desc" }]
                },
                pageSize: 1
            }), "getDataUser");

            const users = existingUser?.data?.data ?? [];
            if (users.length > 0) {
                const user = users[0];
                const cliente = await safeCall(() => getDataUserPerfil({
                    table: "clientes",
                    filtros: {
                        Filtros: [{ key: "email", operator: "=", value: user.email }]
                    },
                    pageSize: 1
                }), "getDataPerfil");

                const userData = { ...user, ...cliente.data.data[0] };
                setDataUser(userData);
                setTempUserData(userData);

                // Obtener pedidos del usuario
                const pedidos = await safeCall(() => getDataUserPerfil({
                    table: "listas left join clientes on listas.id_cliente = clientes.id",
                    pageSize: 1000000,
                    page: 1,
                    tag: 'Pedidos',
                    filtros: {
                        Selects: [
                            { key: "listas.nombre_lista" },
                            { key: "listas.array_lista" },
                            { key: "listas.fecha_creacion" },
                            { key: "listas.estado" }
                        ],
                        Filtros: [
                            { key: "listas.usuario_id", value: userId, operator: "=" },
                        ],
                        Order: [
                            { Key: "listas.fecha_creacion", Direction: "Desc" }
                        ]
                    }
                }), "getPedidos");

                const resumen = procesarResumen(pedidos);
                setResumen(resumen);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    }

    const procesarResumen = (pedidosData: any): ResumenData => {
        const pedidosArray = pedidosData?.data?.data || [];
        let totalAhorro = 0;
        let totalPedidos = pedidosArray.length;
        const fechaCount: Record<string, number> = {};
        const estadoCount: Record<string, number> = {};

        pedidosArray.forEach((pedido: any) => {
            const fecha = pedido.fecha_creacion?.split('T')[0] || '';
            if (fecha) {
                fechaCount[fecha] = (fechaCount[fecha] || 0) + 1;
            }

            // Contar por estado
            const estado = pedido.estado || 'PENDIENTE';
            estadoCount[estado] = (estadoCount[estado] || 0) + 1;

            // Calcular ahorro
            try {
                const items = JSON.parse(pedido.array_lista);
                items.forEach((item: any) => {
                    if (item.descuento && !isNaN(parseFloat(item.descuento))) {
                        totalAhorro += parseFloat(item.descuento);
                    }
                });
            } catch (error) {
                console.error('Error parsing array_lista:', error);
            }
        });

        const fechasMasSolicitadas = Object.entries(fechaCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([fecha, count]) => ({ fecha, pedidos: count }));

        const promedioPedidosPorDia = totalPedidos > 0 ?
            totalPedidos / Object.keys(fechaCount).length : 0;

        return {
            totalAhorro: totalAhorro.toFixed(2),
            totalPedidos,
            fechasMasSolicitadas,
            pedidosPorEstado: estadoCount,
            promedioPedidosPorDia
        };
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const formatFecha = (fecha: string) => {
        if (!fecha) return "No disponible";
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
                month: 'short',
                year: 'numeric'
            });
        }
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleSave = async () => {
        try {
            // Aquí iría la lógica para guardar los cambios
            setEditMode(false);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    };

    const handleCancel = () => {
        setTempUserData(dataUser);
        setEditMode(false);
    };

    const handleLogout = async () => {
        try {
            const userId = getLocalStorageItem("user-id");
            await logoutUser(userId).unwrap();
            history.push('/login');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const formatEstado = (estado: string) => {
        const estados: Record<string, { label: string, color: string }> = {
            'COMPLETADO': { label: 'Completado', color: 'success' },
            'PENDIENTE': { label: 'Pendiente', color: 'warning' },
            'CANCELADO': { label: 'Cancelado', color: 'danger' },
            'PROCESANDO': { label: 'Procesando', color: 'primary' }
        };
        return estados[estado] || { label: estado, color: 'medium' };
    };

    if (loading) {
        return (
            <IonContent>
                <div className="p-6 space-y-6">
                    <IonSkeletonText animated style={{ width: '60%', height: '32px' }} />
                    <IonSkeletonText animated style={{ width: '100%', height: '200px' }} />
                    <div className="grid grid-cols-2 gap-4">
                        <IonSkeletonText animated style={{ width: '100%', height: '100px' }} />
                        <IonSkeletonText animated style={{ width: '100%', height: '100px' }} />
                    </div>
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
            <div className="pb-8 px-4 max-w-6xl mx-auto">
                {/* Tarjeta de Perfil Principal */}
                <IonButton
                    fill="solid"
                    color="light"
                    expand="block"
                    onClick={() => setIsOpen(true)}
                    className="font-semibold"
                >
                    Iniciar Sesión
                </IonButton>
                <div className="mb-8 relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${nivelUsuario.color} rounded-3xl opacity-10`} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
                        {/* Encabezado del perfil */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {dataUser?.nombre?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                            {dataUser?.nombre || 'Usuario'}
                                        </h1>
                                        <IonBadge
                                            className={`bg-gradient-to-r ${nivelUsuario.color} text-white font-medium px-3 py-1 rounded-full`}
                                        >
                                            <div className="flex items-center gap-1">
                                                {nivelUsuario.icon}
                                                <span>{nivelUsuario.nivel}</span>
                                            </div>
                                        </IonBadge>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Miembro desde {formatFecha(dataUser?.fecha_registro || '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {editMode ? (
                                    <>
                                        <IonButton
                                            onClick={handleSave}
                                            color="success"
                                            fill="solid"
                                            className="gap-2"
                                        >
                                            <Save className="size-4" />
                                            Guardar
                                        </IonButton>
                                        <IonButton
                                            onClick={handleCancel}
                                            color="medium"
                                            fill="outline"
                                            className="gap-2"
                                        >
                                            <X className="size-4" />
                                            Cancelar
                                        </IonButton>
                                    </>
                                ) : (
                                    <IonButton
                                        onClick={handleEdit}
                                        color="primary"
                                        fill="outline"
                                        className="gap-2"
                                    >
                                        <Edit2 className="size-4" />
                                        Editar Perfil
                                    </IonButton>
                                )}
                            </div>
                        </div>

                        {/* Información del usuario */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <InfoCard
                                icon={<Mail className="size-5" />}
                                title="Correo Electrónico"
                                value={dataUser?.email || 'No disponible'}
                                editable={editMode}
                            />
                            <InfoCard
                                icon={<Phone className="size-5" />}
                                title={"Teléfono" + (dataUser?.rol === "cliente" && " (Contraseña)" || "")}
                                value={dataUser?.telefono || 'No disponible'}
                                editable={editMode}
                                isPhone={true}
                            />
                            <InfoCard
                                icon={<Calendar className="size-5" />}
                                title="Última Actualización"
                                value={formatFecha(dataUser?.fecha_actualizacion || dataUser?.fecha_registro || '')}
                            />
                            <InfoCard
                                icon={<IdCard className="size-5" />}
                                title="ID de Usuario"
                                value={((dataUser?.rol || '') + '-' + (dataUser?.id || '') + '-' + (dataUser?.usuario_id || '')).toUpperCase()}
                                copyable={true}
                            />
                        </div>

                        {/* Barra de progreso del nivel */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Progreso al siguiente nivel
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {resumen.totalPedidos} / 50 pedidos
                                </span>
                            </div>
                            <IonProgressBar
                                value={resumen.totalPedidos / 50}
                                className="h-2 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Estadísticas y Métricas */}
                <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                    Estadísticas de Compras
                </h2>

                <BentoGrid cols={3}>
                    {/* Resumen de pedidos */}
                    <BentoItem
                        rowSpan={1}
                        colSpan={1}
                        title="Resumen de Pedidos"
                        icon={<BarChart3 className="size-6 text-blue-500" />}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Pedidos</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {resumen.totalPedidos}
                                    </p>
                                </div>
                                <Box className="size-8 text-blue-500" />
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Por Estado</h4>
                                {Object.entries(resumen.pedidosPorEstado).map(([estado, cantidad]) => {
                                    const estadoInfo = formatEstado(estado);
                                    return (
                                        <div key={estado} className="flex items-center justify-between">
                                            <Badge color="gray" text={estadoInfo.label} />
                                            <span className="font-semibold">{cantidad}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </BentoItem>

                    {/* Ahorro total */}
                    <BentoItem
                        colSpan={1}
                        title="Ahorro Total"
                        icon={<DollarSign className="size-6 text-green-500" />}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
                    >
                        <div className="p-4">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {formatValue(resumen.totalAhorro, 'currency', 2)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Descuentos acumulados en todas tus compras
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                                <TrendingDown className="size-4" />
                                <span className="text-sm font-medium">¡Sigue ahorrando!</span>
                            </div>
                        </div>
                    </BentoItem>

                    {/* Actividad reciente */}
                    <BentoItem
                        colSpan={1}
                        title="Días Más Activos"
                        icon={<CalendarDays className="size-6 text-purple-500" />}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800"
                    >
                        <div className="space-y-3">
                            {resumen.fechasMasSolicitadas.length > 0 ? (
                                resumen.fechasMasSolicitadas.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {formatFecha(item.fecha)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.pedidos} pedido{item.pedidos !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <ChevronRight className="size-4 text-gray-400" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay actividad registrada
                                </p>
                            )}
                        </div>
                    </BentoItem>

                </BentoGrid>

                {/* Información adicional */}
                {/*  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <IonCard className="rounded-2xl">
                        <IonCardContent>
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="size-6 text-purple-500" />
                                <h3 className="text-lg font-semibold">Métodos de Pago</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Gestiona tus métodos de pago guardados para una compra más rápida
                            </p>
                            <IonButton fill="clear" size="small">
                                Administrar pagos
                                <ChevronRight className="size-4 ml-1" />
                            </IonButton>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="rounded-2xl">
                        <IonCardContent>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="size-6 text-green-500" />
                                <h3 className="text-lg font-semibold">Seguridad</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Actualiza tu contraseña y revisa la actividad de tu cuenta
                            </p>
                            <IonButton fill="clear" size="small">
                                Gestionar seguridad
                                <ChevronRight className="size-4 ml-1" />
                            </IonButton>
                        </IonCardContent>
                    </IonCard>
                </div> */}
            </div>
            <IonModal
                                isOpen={isOpen}
                                onDidDismiss={() => setIsOpen(false)}
                                className="login-modal"
                                breakpoints={[0.25, 0.5, 0.75]}
                                initialBreakpoint={0.75}
                            >
                                <IonHeader className="ion-no-border">
                                    <IonToolbar>
                                        <IonTitle className="text-lg font-medium font-sans">Iniciar Sesión</IonTitle>
                                        <IonButtons slot="end">
                                            <IonButton
                                                onClick={() => setIsOpen(false)}
                                                strong
                                            >
                                                <X className="text-purple-700" />
                                            </IonButton>
                                        </IonButtons>
                                    </IonToolbar>
                                </IonHeader>
                                <IonContent className="ion-padding-horizontal">
                                    <div className="max-w-sm mx-auto py-4">
                                        <MainForm
                                            actionType="post-login"
                                            dataForm={LogInField()}
                                            message_button="Iniciar Sesión"
                                            onSuccess={() => {
                                                try {
                                                    setIsOpen(false);
                                                } catch {
                                                    presentAlert({
                                                        header: 'Error al inicio de sesion',
                                                        subHeader: 'Datos recibidos pero no validados',
                                                        message: 'Intenta mas tarde, hay errores de validacion en este momento.',
                                                        buttons: ['Ok'],
                                                    })
                                                }
                                            }}
                                        />
                                    </div>
                                </IonContent>
                            </IonModal>
        </IonContent>
    );
};

// Componente auxiliar para mostrar información
const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
    editable?: boolean;
    copyable?: boolean;
    isPhone?: boolean;
}> = ({ icon, title, value, editable = false, copyable = false, isPhone = false }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        // Podrías agregar un toast de confirmación aquí
    };

    return (
        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                {icon}
                <span className="text-sm font-medium">{title}</span>
            </div>
            {editable ? (
                <IonInput
                    value={value}
                    className="custom-input"
                    type={isPhone ? "tel" : "text"}
                />
            ) : (
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 dark:text-white font-medium break-all">
                        {value}
                    </p>
                    {copyable && (
                        <IonButton
                            fill="clear"
                            size="small"
                            onClick={handleCopy}
                            className="ml-2"
                        >
                            Copiar
                        </IonButton>
                    )}
                </div>
            )}
        </div>
    );
};

export default PerfilPage;