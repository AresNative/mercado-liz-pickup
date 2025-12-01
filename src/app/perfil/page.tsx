import {
    IonCard,
    IonCardContent,
    IonInput,
    IonLabel,
    IonItem,
    IonRouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonBackButton,
    IonAlert,
    IonLoading
} from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import { User, Mail, Phone, Calendar, Package, TrendingDown, Edit2, Save, X, CreditCard, MapPin, Settings } from "lucide-react";
import { PageProps } from "@/utils/types/page";
import { IconLiz } from "../productos/components/ionc-liz";
import { useAppSelector } from "@/hooks/selector";
import { RootState } from "@/hooks/store";
import { useHistory } from "react-router";
import { formatValue } from '@/utils/constants/format-values';

// API hooks (similares al checkout)
import {
    useGetWithFiltersMutation,
    usePutMutation
} from "@/hooks/reducers/api";

// Auth hooks
import {
    useLoginUserMutation,
    useLogoutUserMutation
} from "@/hooks/reducers/auth";

// Local storage utils
import {
    getLocalStorageItem,
    setLocalStorageItem
} from "@/utils/functions/local-storage";

// Safe call utility (similar al checkout)
async function safeCall<T>(fn: () => Promise<T>, context: string): Promise<T> {
    try {
        const res: any = await fn();
        if (res && "error" in res) {
            throw new Error(`Error en ${context}: ${JSON.stringify(res.error)}`);
        }
        return res;
    } catch (err: any) {
        console.error(`❌ ${context}:`, err);
        throw new Error(err.message || `Fallo en ${context}`);
    }
}

interface UserProfile {
    id?: string;
    name: string;
    email: string;
    phone: string;
    employeeNumber: string;
    loyaltyPoints: number;
    memberSince: string;
    totalOrders: number;
    totalSavings: number;
    role?: string;
    sucursal?: number;
    createdAt?: string;
}

const PerfilPage: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // --- Estados ---
    const [user, setUser] = useState<UserProfile>({
        name: "",
        email: "",
        phone: "",
        employeeNumber: "",
        loyaltyPoints: 0,
        memberSince: new Date().toISOString().split('T')[0],
        totalOrders: 0,
        totalSavings: 0
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // --- Hooks ---
    const history = useHistory();
    const cart = useAppSelector((state: RootState) => state.cart);
    const [GetData] = useGetWithFiltersMutation();
    const [PutData] = usePutMutation();
    const [loginUser] = useLoginUserMutation();
    const [logoutUser] = useLogoutUserMutation();

    // --- Efectos ---
    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (user.name) {
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone,
            });
        }
    }, [user]);

    // --- Funciones ---
    const loadUserData = async () => {
        setIsLoading(true);
        try {
            // 1. Intentar obtener datos del localStorage
            const userId = getLocalStorageItem("user-id");
            const userData = getLocalStorageItem("user-data");
            const token = getLocalStorageItem("token");

            console.log("🔍 Cargando datos de usuario:", { userId, userData, token });

            if (!userId || !token) {
                // Usuario no autenticado
                console.warn("⚠ Usuario no autenticado, mostrando datos por defecto");
                setUser({
                    name: "Invitado",
                    email: "invitado@example.com",
                    phone: "000-000-0000",
                    employeeNumber: "EMP-0000",
                    loyaltyPoints: 0,
                    memberSince: new Date().toISOString().split('T')[0],
                    totalOrders: 0,
                    totalSavings: 0
                });
                setIsLoading(false);
                return;
            }

            // 2. Si hay userData en localStorage, usarlo temporalmente
            if (userData) {
                setUser(prev => ({
                    ...prev,
                    name: userData.nombre || userData.name || "",
                    email: userData.correo || userData.email || "",
                    phone: userData.telefono || userData.phone || "",
                }));
            }

            // 3. Obtener datos completos del backend
            const userResponse = await safeCall(() => GetData({
                url: "v1/users",
                filtros: {
                    Filtros: [{ Key: "id", Value: userId }],
                    Order: [{ Key: "id", Direction: "Desc" }]
                },
                pageSize: 1
            }), "obtener datos de usuario");

            const users = userResponse?.data?.data ?? [];

            if (users.length > 0) {
                const userDataFromApi = users[0];

                // 4. Obtener estadísticas del usuario
                const statsResponse = await safeCall(() => GetData({
                    url: "v1/pickup/clientes",
                    filtros: {
                        Filtros: [{ Key: "email", Value: userDataFromApi.email }],
                        Order: [{ Key: "id", Direction: "Desc" }]
                    },
                    pageSize: 100
                }), "obtener estadísticas de usuario");

                const clientData = statsResponse?.data?.data ?? [];
                const totalOrders = clientData.length;

                // Calcular ahorros (ejemplo simplificado)
                const totalSavings = clientData.reduce((sum: number, order: any) => {
                    return sum + (order.total_savings || 0);
                }, 0);

                // 5. Actualizar estado con datos reales
                setUser({
                    name: userDataFromApi.nombre || userDataFromApi.name || "",
                    email: userDataFromApi.email || "",
                    phone: userDataFromApi.telefono || userDataFromApi.phone || "",
                    employeeNumber: userDataFromApi.employeeNumber || `EMP-${userDataFromApi.id?.slice(-4)}` || "EMP-0000",
                    loyaltyPoints: userDataFromApi.loyaltyPoints || 0,
                    memberSince: userDataFromApi.createdAt || userDataFromApi.memberSince || new Date().toISOString().split('T')[0],
                    totalOrders,
                    totalSavings,
                    role: userDataFromApi.role,
                    sucursal: userDataFromApi.sucursal,
                    createdAt: userDataFromApi.createdAt
                });

                // 6. Actualizar localStorage con datos frescos
                setLocalStorageItem("user-data", {
                    nombre: userDataFromApi.nombre || userDataFromApi.name,
                    correo: userDataFromApi.email,
                    telefono: userDataFromApi.telefono || userDataFromApi.phone,
                    id: userId
                });

            } else {
                console.warn("⚠ No se encontraron datos del usuario en el backend");
            }

        } catch (error: any) {
            console.error("❌ Error al cargar datos del usuario:", error);
            setErrorMessage("No se pudieron cargar los datos del perfil");
            setShowErrorAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
            setErrorMessage("Todos los campos son obligatorios");
            setShowErrorAlert(true);
            return;
        }

        setIsSaving(true);
        try {
            const userId = getLocalStorageItem("user-id");

            if (!userId) {
                throw new Error("Usuario no autenticado");
            }

            // 1. Actualizar en el backend
            await safeCall(() => PutData({
                url: "v1/users",
                id: userId,
                data: {
                    nombre: formData.name,
                    email: formData.email,
                    telefono: formData.phone
                }
            }), "actualizar usuario");

            // 2. Actualizar en localStorage
            const currentUserData = getLocalStorageItem("user-data") || {};
            setLocalStorageItem("user-data", {
                ...currentUserData,
                nombre: formData.name,
                correo: formData.email,
                telefono: formData.phone
            });

            // 3. Actualizar estado local
            setUser(prev => ({
                ...prev,
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            }));

            // 4. Mostrar confirmación
            setShowSuccessAlert(true);
            setIsEditing(false);

        } catch (error: any) {
            console.error("❌ Error al guardar cambios:", error);
            setErrorMessage(error.message || "No se pudieron guardar los cambios");
            setShowErrorAlert(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
        });
        setIsEditing(false);
    };

    const handleLogout = async () => {
        try {
            const userId = getLocalStorageItem("user-id");
            if (userId) {
                await logoutUser(userId);
            }
        } catch (error) {
            console.warn("Error en logout backend:", error);
        } finally {
            // Limpiar localStorage

            // Redirigir al login
            history.push("/login");
        }
    };

    const handleCardClick = (route: string) => {
        history.push(route);
    };

    // --- Render ---
    return (
        <IonContent
            fullscreen
            scrollEvents
            onIonScroll={(e) => {
                const isScrolled = e.detail.scrollTop > 20;
                onScroll?.(isScrolled);
            }}>

            <IonHeader
                collapse="condense"
                className="custom-toolbar h-fit absolute -top-0">
                <IonToolbar>
                    <a className='decoration-none cursor-pointer' href='/productos'>
                        <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                    </a>
                </IonToolbar>
            </IonHeader>

            <section className="flex px-4 pt-2">
                <IonBackButton color="tertiary" text="Regresar" />
            </section>

            <section className="py-1 px-4 max-w-6xl mx-auto space-y-5 md:mb-0 mb-16">
                {/* Alertas */}
                <IonAlert
                    isOpen={showSuccessAlert}
                    header="¡Éxito!"
                    message="Los cambios se han guardado correctamente"
                    buttons={["Aceptar"]}
                    onDidDismiss={() => setShowSuccessAlert(false)}
                />

                <IonAlert
                    isOpen={showErrorAlert}
                    header="Error"
                    message={errorMessage}
                    buttons={["Aceptar"]}
                    onDidDismiss={() => setShowErrorAlert(false)}
                />

                <IonLoading
                    isOpen={isLoading || isSaving}
                    message={isLoading ? "Cargando perfil..." : "Guardando cambios..."}
                />

                {/* Título */}
                <div className="pt-4">
                    <h1 className="text-3xl font-bold text-black mb-1">Mi Perfil</h1>
                    <p className="text-gray-500 mb-6">Gestión de información personal</p>
                </div>

                {/* Tarjeta principal del usuario */}
                <IonCard className="shadow-sm border mb-8">
                    <IonCardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-3xl shadow-md">
                            👤
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-bold text-black mb-1">{user.name}</p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            {user.employeeNumber}
                                        </span>
                                        {user.role && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                {user.role}
                                            </span>
                                        )}
                                        {user.sucursal && (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                Sucursal {user.sucursal}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <IonButton
                                    fill="outline"
                                    size="small"
                                    onClick={handleLogout}
                                    className="mt-2 sm:mt-0"
                                >
                                    Cerrar Sesión
                                </IonButton>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-sm text-gray-500">Puntos de lealtad</p>
                                    <p className="text-xl font-bold text-black">{user.loyaltyPoints} pts</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Miembro desde</p>
                                    <p className="text-sm font-medium text-black">
                                        {new Date(user.memberSince).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </IonCardContent>
                </IonCard>

                {/* Tres tarjetas superiores */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <IonCard className="shadow-sm border hover:shadow-md transition-shadow">
                        <IonCardContent className="flex gap-4 items-center p-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-black">{user.totalOrders}</p>
                                <p className="text-sm text-gray-500">Pedidos realizados</p>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="shadow-sm border hover:shadow-md transition-shadow">
                        <IonCardContent className="flex gap-4 items-center p-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingDown className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-black">
                                    {formatValue(user.totalSavings, "currency")}
                                </p>
                                <p className="text-sm text-gray-500">Ahorrado en total</p>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    <IonCard
                        className="shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleCardClick("/perfil/pedidos")}
                    >
                        <IonCardContent className="flex gap-4 items-center p-4">
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black">Historial de Pedidos</p>
                                <p className="text-sm text-gray-500">Ver todos mis pedidos</p>
                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>

                {/* Información Personal */}
                <IonCard className="shadow-sm border mb-8">
                    <IonCardContent className="p-6">
                        {/* Título + botones */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-black mb-1">Información Personal</h2>
                                <p className="text-sm text-gray-500">Actualiza tus datos de contacto</p>
                            </div>

                            {!isEditing ? (
                                <IonButton
                                    fill="outline"
                                    onClick={() => setIsEditing(true)}
                                    className="min-w-[120px]"
                                >
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                </IonButton>
                            ) : (
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <IonButton
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSaving ? "Guardando..." : "Guardar"}
                                    </IonButton>
                                    <IonButton
                                        fill="outline"
                                        onClick={handleCancel}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <X className="h-4 w-4 mr-2" /> Cancelar
                                    </IonButton>
                                </div>
                            )}
                        </div>

                        {/* Campos del formulario */}
                        <div className="space-y-6">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-black">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Nombre Completo</span>
                                </div>
                                {isEditing ? (
                                    <IonInput
                                        value={formData.name}
                                        placeholder="Ingresa tu nombre completo"
                                        onIonChange={(e) => setFormData({ ...formData, name: e.detail.value! })}
                                        className="border rounded-lg px-3 py-2"
                                    />
                                ) : (
                                    <p className="text-black font-medium text-lg pl-6">{user.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-black">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Correo Electrónico</span>
                                </div>
                                {isEditing ? (
                                    <IonInput
                                        type="email"
                                        value={formData.email}
                                        placeholder="correo@ejemplo.com"
                                        onIonChange={(e) => setFormData({ ...formData, email: e.detail.value! })}
                                        className="border rounded-lg px-3 py-2"
                                    />
                                ) : (
                                    <p className="text-black font-medium text-lg pl-6">{user.email}</p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-black">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Teléfono</span>
                                </div>
                                {isEditing ? (
                                    <IonInput
                                        type="tel"
                                        value={formData.phone}
                                        placeholder="XXX-XXX-XXXX"
                                        onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value! })}
                                        className="border rounded-lg px-3 py-2"
                                    />
                                ) : (
                                    <p className="text-black font-medium text-lg pl-6">{user.phone}</p>
                                )}
                            </div>
                        </div>
                    </IonCardContent>
                </IonCard>

                {/* Enlaces rápidos */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-black mb-4">Configuración</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { route: "/perfil/tarjetas", icon: <CreditCard className="h-6 w-6" />, title: "Tarjetas Guardadas", desc: "Métodos de pago", color: "bg-blue-100 text-blue-600" },
                            { route: "/perfil/direcciones", icon: <MapPin className="h-6 w-6" />, title: "Direcciones", desc: "Direcciones de entrega", color: "bg-green-100 text-green-600" },
                            { route: "/perfil/pedidos", icon: <Package className="h-6 w-6" />, title: "Mis Pedidos", desc: "Historial de pedidos", color: "bg-purple-100 text-purple-600" },
                            { route: "/perfil/configuracion", icon: <Settings className="h-6 w-6" />, title: "Configuración", desc: "Preferencias de usuario", color: "bg-gray-100 text-gray-600" },
                        ].map((item, index) => (
                            <IonCard
                                key={index}
                                className="shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleCardClick(item.route)}
                            >
                                <IonCardContent className="flex gap-4 items-center p-4">
                                    <div className={`h-12 w-12 rounded-full ${item.color} flex items-center justify-center`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-black">{item.title}</p>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                    <div className="text-gray-400">
                                        →
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ))}
                    </div>
                </div>

                {/* Carrito actual (si existe) */}
                {cart.items && cart.items.length > 0 && (
                    <IonCard className="shadow-sm border bg-blue-50">
                        <IonCardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-black">Tienes {cart.items.length} items en tu carrito</p>
                                    <p className="text-sm text-gray-500">Continúa con tu compra</p>
                                </div>
                                <IonButton
                                    routerLink="/carrito"
                                    className="custom-tertiary"
                                >
                                    Ver Carrito
                                </IonButton>
                            </div>
                        </IonCardContent>
                    </IonCard>
                )}
            </section>
        </IonContent>
    );
};

export default PerfilPage;