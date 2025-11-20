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
    IonButton
} from "@ionic/react";
import { useState } from "react";
import { User, Mail, Phone, Calendar, Package, TrendingDown, Edit2, Save, X } from "lucide-react";
import { PageProps } from "@/utils/types/page";
import { IconLiz } from "../productos/components/ionc-liz";


const PerfilPage: React.FC<PageProps> = ({ onScroll }: PageProps) => {
    // --- Usuario genérico temporal ---
    const [user, setUser] = useState({
        name: "Juan Pérez",
        email: "juan@example.com",
        phone: "555-123-4567",
        employeeNumber: "EMP-1023",
        loyaltyPoints: 150,
        memberSince: "2022-04-10",
        totalOrders: 38,
        totalSavings: 215.75,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
    });

    const handleSave = () => {
        setUser({ ...user, ...formData });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
        });
        setIsEditing(false);
    };

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
                    <IconLiz fill={onScroll ? "#FFF" : "#7927F5"} width={55} />
                </IonToolbar>
            </IonHeader>
            <section className="py-1 px-2 max-w-6xl mx-auto space-y-5">
                {/* Título */}
                <h1 className="text-3xl font-bold text-black mb-1">Mi Perfil</h1>
                <p className="text-gray-500 mb-6">Gestión de información personal</p>

                {/* Tarjeta principal del usuario */}
                <IonCard className="shadow-sm border mb-8">
                    <IonCardContent className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                            👤
                        </div>
                        <div>
                            <p className="text-xl font-bold text-black">{user.name}</p>
                            <p className="text-sm text-gray-500">ID Empleado: {user.employeeNumber}</p>
                            <p className="text-sm text-gray-500">Puntos: {user.loyaltyPoints}</p>
                        </div>
                    </IonCardContent>
                </IonCard>

                {/* Tres tarjetas superiores */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <IonCard className="shadow-sm border">
                        <IonCardContent className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-black">{user.totalOrders}</p>
                                <p className="text-sm text-gray-500">Pedidos realizados</p>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="shadow-sm border">
                        <IonCardContent className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingDown className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-black">€{user.totalSavings.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">Ahorrado en total</p>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="shadow-sm border">
                        <IonCardContent className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black">Miembro desde</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(user.memberSince).toLocaleDateString("es-ES", {
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>

                {/* Información Personal */}
                <IonCard className="shadow-sm border">
                    <IonCardContent>

                        {/* Título + botones */}
                        <div className="flex justify-between mb-6">
                            <h2 className="text-2xl font-bold text-black">Información Personal</h2>

                            {!isEditing ? (
                                <IonButton fill="outline" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                </IonButton>
                            ) : (
                                <div className="flex gap-2">
                                    <IonButton onClick={handleSave}>
                                        <Save className="h-4 w-4 mr-2" /> Guardar
                                    </IonButton>
                                    <IonButton fill="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" /> Cancelar
                                    </IonButton>
                                </div>
                            )}
                        </div>

                        {/* Nombre */}
                        <IonItem lines="none" className="mb-4">
                            <IonLabel position="stacked">
                                <div className="flex items-center gap-2 text-black">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Nombre
                                </div>
                            </IonLabel>
                            {isEditing ? (
                                <IonInput
                                    value={formData.name}
                                    onIonChange={(e) => setFormData({ ...formData, name: e.detail.value! })}
                                />
                            ) : (
                                <p className="text-black font-medium">{user.name}</p>
                            )}
                        </IonItem>

                        {/* Email */}
                        <IonItem lines="none" className="mb-4">
                            <IonLabel position="stacked">
                                <div className="flex items-center gap-2 text-black">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Email
                                </div>
                            </IonLabel>
                            {isEditing ? (
                                <IonInput
                                    type="email"
                                    value={formData.email}
                                    onIonChange={(e) => setFormData({ ...formData, email: e.detail.value! })}
                                />
                            ) : (
                                <p className="text-black font-medium">{user.email}</p>
                            )}
                        </IonItem>

                        {/* Teléfono */}
                        <IonItem lines="none">
                            <IonLabel position="stacked">
                                <div className="flex items-center gap-2 text-black">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    Teléfono
                                </div>
                            </IonLabel>
                            {isEditing ? (
                                <IonInput
                                    type="tel"
                                    value={formData.phone}
                                    onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value! })}
                                />
                            ) : (
                                <p className="text-black font-medium">{user.phone}</p>
                            )}
                        </IonItem>

                    </IonCardContent>
                </IonCard>

                {/* Enlaces */}
                <div className="grid gap-1 md:grid-cols-2">

                    <IonRouterLink routerLink="/perfil/tarjetas">
                        <IonCard className="shadow-sm border hover:border-blue-500 transition">
                            <IonCardContent className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    💳
                                </div>
                                <div>
                                    <p className="font-semibold text-black">Tarjetas Guardadas</p>
                                    <p className="text-sm text-gray-500">Métodos de pago</p>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </IonRouterLink>

                    <IonRouterLink routerLink="/perfil/direcciones">
                        <IonCard className="shadow-sm border hover:border-blue-500 transition">
                            <IonCardContent className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    📍
                                </div>
                                <div>
                                    <p className="font-semibold text-black">Direcciones</p>
                                    <p className="text-sm text-gray-500">Direcciones de entrega</p>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </IonRouterLink>

                    <IonRouterLink routerLink="/perfil/ahorros">
                        <IonCard className="shadow-sm border hover:border-blue-500 transition">
                            <IonCardContent className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <TrendingDown className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-black">Mis Ahorros</p>
                                    <p className="text-sm text-gray-500">Tu historial de ahorro</p>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </IonRouterLink>

                    <IonRouterLink routerLink="/perfil/configuracion">
                        <IonCard className="shadow-sm border hover:border-blue-500 transition">
                            <IonCardContent className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    ⚙️
                                </div>
                                <div>
                                    <p className="font-semibold text-black">Configuración</p>
                                    <p className="text-sm text-gray-500">Preferencias de usuario</p>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    </IonRouterLink>

                </div>
            </section>
        </IonContent>

    );

}
export default PerfilPage;