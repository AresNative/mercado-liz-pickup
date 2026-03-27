import MainForm from "@/components/form/main-form";
import { useLogoutUserMutation } from "@/hooks/reducers/auth";
import { LogInField } from "@/utils/constants/forms/logIn";
import { navigationAdmin, navigationDefault } from "@/utils/constants/router";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonModal,
    IonButtons,
    useIonAlert,
} from "@ionic/react";
import { X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const AppMenu = () => {
    // Obtener valores de forma correcta y tipada
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

    const getNavigation = () => {
        return navigationDefault;
    };

    return (
        <>
            <IonMenu contentId="main-content" side="end" className="">
                <IonHeader className="custom-toolbar">
                    <IonToolbar>
                        {userRole ? (
                            <div className="p-4 text-center">
                                <IonTitle>{userRole}</IonTitle>
                                <IonButton
                                    expand="block"
                                    fill="solid"
                                    color="light"
                                    onClick={logout}
                                    className="mt-3"
                                >
                                    Cerrar Sesión
                                </IonButton>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                <IonButton
                                    fill="solid"
                                    color="light"
                                    expand="block"
                                    onClick={() => setIsOpen(true)}
                                    className="font-semibold"
                                >
                                    Iniciar Sesión
                                </IonButton>
                                {/*  <IonButton
                                    color="light"
                                    expand="block"
                                    fill="outline"
                                    routerLink="/register"
                                    className="font-semibold"
                                >
                                    Registrarse
                                </IonButton> */}
                            </div>
                        )}
                    </IonToolbar>
                </IonHeader>

                <IonContent className="bg-white p-2 z-50">
                    <IonList lines="none">
                        {getNavigation().map((item: any) => {
                            const Icon = item.icon;
                            if (!Icon) return
                            return (
                                <IonItem
                                    key={item.href}
                                    routerLink={item.href}
                                    routerDirection="none"
                                    detail={false}
                                    className="rounded-lg p-2"
                                >
                                    <Icon size={20} className="mx-3 text-gray-600" />
                                    <IonLabel className="font-medium">{item.name}</IonLabel>
                                </IonItem>
                            );
                        })}
                    </IonList>
                </IonContent>
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
            </IonMenu>
        </>
    );
};

export default AppMenu;