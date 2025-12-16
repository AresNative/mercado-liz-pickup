import {
    IonCard,
    IonCardContent,
    IonInput,
    IonItem,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonBackButton,
    IonAlert,
    IonLoading
} from "@ionic/react";
import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, Package, TrendingDown, Edit2, Save, X, CreditCard, MapPin, Settings } from "lucide-react";
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

// Safe call utility
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

// Componente Skeleton para loading
const ProfileSkeleton = () => (
    <div className="space-y-6 p-4">
        <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
        </div>
        <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    </div>
);

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
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loadError, setLoadError] = useState<string | null>(null);

    // --- Hooks ---
    const history = useHistory();
    const cart = useAppSelector((state: RootState) => state.cart);
    const [GetDataGeneral] = useGetWithFiltersGeneralMutation(); // Cambiado a GetWithFiltersGeneral
    const [PutData] = usePutMutation();
    const [logoutUser] = useLogoutUserMutation();

    // --- Efectos ---
    useEffect(() => {
        const userId = getLocalStorageItem("user-id");
        if (userId) {
            loadUserData();
        } else {
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
        }
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
    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) errors.push("El nombre es obligatorio");
        if (!formData.email.trim()) errors.push("El correo electrónico es obligatorio");
        if (!formData.phone.trim()) errors.push("El teléfono es obligatorio");

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.push("El correo electrónico no es válido");
        }

        return errors;
    };

    const loadUserData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const userId = getLocalStorageItem("user-id");
            const userData = getLocalStorageItem("user-data");
            const token = getLocalStorageItem("token");

            if (!userId || !token) {
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

            // Usar datos de localStorage temporalmente
            if (userData) {
                setUser(prev => ({
                    ...prev,
                    name: userData.nombre || userData.name || "",
                    email: userData.correo || userData.email || "",
                    phone: userData.telefono || userData.phone || "",
                }));
            }

            // CONSULTA DE USUARIO USANDO getWithFiltersGeneral
            const userResponse = await safeCall(() => GetDataGeneral({
                table: "usuarios", // Tabla especificada
                page: 1,
                pageSize: 1,
                filtros: {
                    Filtros: [{ Key: "id", Value: userId }],
                    Order: [{ Key: "id", Direction: "Desc" }]
                }
            }), "obtener datos de usuario");

            const users = userResponse?.data?.data ?? [];

            if (users.length > 0) {
                const userDataFromApi = users[0];

                // CONSULTA DE ESTADÍSTICAS USANDO getWithFiltersGeneral
                const statsResponse = await safeCall(() => GetDataGeneral({
                    table: "clientes", // Tabla para estadísticas
                    page: 1,
                    pageSize: 100,
                    filtros: {
                        Filtros: [{ Key: "email", Value: userDataFromApi.email }],
                        Order: [{ Key: "id", Direction: "Desc" }]
                    }
                }), "obtener estadísticas de usuario");

                const clientData = statsResponse?.data?.data[0] ?? [];
                const totalOrders = clientData.length;
                /* const totalSavings = clientData.reduce((sum: number, order: any) => {
                    return sum + (order.total_savings || 0);
                }, 0); */
                console.log(clientData);

                // Mapear datos de la API al formato del estado
                setUser({
                    name: userDataFromApi.nombre || userDataFromApi.name || "",
                    email: userDataFromApi.email || "",
                    phone: userDataFromApi.telefono || userDataFromApi.phone || "",
                    employeeNumber: `ID-${userDataFromApi.id}`,
                    loyaltyPoints: userDataFromApi.loyaltyPoints ||
                        userDataFromApi.puntos_lealtad ||
                        0,
                    memberSince: clientData.fecha_registro,
                    totalOrders,
                    totalSavings: 0,
                    role: userDataFromApi.role || userDataFromApi.rol,
                    sucursal: userDataFromApi.sucursal || userDataFromApi.sucursal_id,
                    createdAt: userDataFromApi.createdAt || userDataFromApi.fecha_creacion
                });

                // Actualizar localStorage
                setLocalStorageItem("user-data", {
                    nombre: userDataFromApi.nombre || userDataFromApi.name,
                    correo: userDataFromApi.email,
                    telefono: userDataFromApi.telefono || userDataFromApi.phone,
                    id: userId,
                    role: userDataFromApi.role || userDataFromApi.rol,
                    sucursal: userDataFromApi.sucursal || userDataFromApi.sucursal_id
                });

            } else {
                console.warn("⚠ No se encontraron datos del usuario en el backend");
                setLoadError("No se encontraron datos del perfil");
            }

        } catch (error: any) {
            console.error("❌ Error al cargar datos del usuario:", error);
            setLoadError("No se pudieron cargar los datos del perfil. Por favor, intenta nuevamente.");
            setErrorMessage("No se pudieron cargar los datos del perfil");
            setShowErrorAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            setErrorMessage(errors.join(". "));
            setShowErrorAlert(true);
            return;
        }

        setIsSaving(true);
        try {
            const userId = getLocalStorageItem("user-id");

            if (!userId) {
                throw new Error("Usuario no autenticado");
            }

            // Actualizar usuario usando el endpoint put
            await safeCall(() => PutData({
                url: "v1/users", // O usar putGeneral si prefieres
                id: userId,
                data: {
                    nombre: formData.name,
                    email: formData.email,
                    telefono: formData.phone
                }
            }), "actualizar usuario");

            // Actualizar localStorage
            const currentUserData = getLocalStorageItem("user-data") || {};
            setLocalStorageItem("user-data", {
                ...currentUserData,
                nombre: formData.name,
                correo: formData.email,
                telefono: formData.phone
            });

            // Actualizar estado local
            setUser(prev => ({
                ...prev,
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            }));

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
            localStorage.removeItem("user-id");
            localStorage.removeItem("user-data");
            localStorage.removeItem("token");
            localStorage.removeItem("cart-items");
            history.push("/login");
        }
    };

    const handleCardClick = (route: string) => {
        history.push(route);
    };

    // Generar badges condicionales
    const userBadges = [
        { condition: user.employeeNumber, text: user.employeeNumber, color: "bg-blue-100 text-blue-800" },
        { condition: user.role, text: user.role, color: "bg-purple-100 text-purple-800" },
        { condition: user.sucursal, text: `Sucursal ${user.sucursal}`, color: "bg-green-100 text-green-800" },
    ].filter(badge => badge.condition);

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

            {isLoading ? (
                <ProfileSkeleton />
            ) : (
                <section className="py-1 px-4 max-w-6xl mx-auto md:mb-0 mb-16">
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

                    <IonAlert
                        isOpen={showLogoutAlert}
                        header="Cerrar Sesión"
                        message="¿Estás seguro de que quieres cerrar sesión?"
                        buttons={[
                            { text: "Cancelar", role: "cancel" },
                            { text: "Cerrar Sesión", handler: () => handleLogout() }
                        ]}
                        onDidDismiss={() => setShowLogoutAlert(false)}
                    />

                    <IonLoading
                        isOpen={isSaving}
                        message="Guardando cambios..."
                    />

                    {/* Título con botón de recarga */}
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-black mb-1">Mi Perfil</h1>
                                <p className="text-gray-500">Gestión de información personal</p>
                            </div>
                            {loadError && (
                                <IonButton
                                    fill="clear"
                                    onClick={loadUserData}
                                    size="small"
                                    className="text-purple-600"
                                >
                                    Reintentar
                                </IonButton>
                            )}
                        </div>
                        {loadError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-red-600 text-sm">{loadError}</p>
                            </div>
                        )}
                    </div>

                    {/* Tarjeta principal del usuario */}
                    <IonCard className="m-0 shadow-sm border mb-4">
                        <IonCardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-3xl shadow-md">
                                👤
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="text-2xl font-bold text-black mb-1">{user.name}</p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {userBadges.map((badge, index) => (
                                                <span key={index} className={`px-3 py-1 ${badge.color} text-xs rounded-full`}>
                                                    {badge.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <IonButton
                                        fill="outline"
                                        size="small"
                                        color={'danger'}
                                        onClick={() => setShowLogoutAlert(true)}
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
                                            {user.memberSince ? new Date(user.memberSince).toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric"
                                            }) : "Fecha no disponible"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Tres tarjetas superiores */}
                    <div className="grid gap-2 md:grid-cols-2 mb-2">
                        <IonCard className="m-0 shadow-sm border hover:shadow-md transition-shadow">
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

                        <IonCard className="m-0 shadow-sm border hover:shadow-md transition-shadow">
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
                    </div>

                    {/* Información Personal */}
                    <IonCard className="m-0 shadow-sm border mb-2">
                        <IonCardContent className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-black mb-1">Información Personal</h2>
                                    <p className="text-sm text-gray-500">Actualiza tus datos de contacto</p>
                                </div>

                                {!isEditing ? (
                                    <IonButton
                                        fill="clear"
                                        color={"medium"}
                                        onClick={() => setIsEditing(true)}
                                        className="min-w-16"
                                    >
                                        <Edit2 className="size-4 mr-2" />
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

                            <div className="space-y-6">
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

                    {/* Carrito actual */}
                    {cart.items && cart.items.length > 0 && (
                        <IonCard className="m-0 shadow-sm border bg-blue-50">
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
            )}
        </IonContent>
    );
};

export default PerfilPage;