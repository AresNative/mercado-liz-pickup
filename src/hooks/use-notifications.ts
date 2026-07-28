// src/hooks/usePushNotifications.ts
import { useEffect } from "react";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { isPlatform } from "@ionic/react";

export const usePushNotifications = () => {
  useEffect(() => {
    if (!isPlatform("android")) return;
    const initializeNotifications = async () => {
        try {
          /* PushNotifications.addListener("registration", (token: Token) => {
            alert("Push registration success, token: " + token.value);
          }); */
        // 1. SOLICITAR PERMISO: El usuario debe aceptar recibir notificaciones.
        const permission = await FirebaseMessaging.requestPermissions();

        if (permission.receive === "granted") {
          console.log("Permiso de notificaciones concedido");

          // 2. REGISTRAR Y OBTENER TOKEN: Este token identifica de forma única el dispositivo.
          //    Lo enviarás a tu servidor (backend) para poder mandarle notificaciones a este usuario.
          const { token } = await FirebaseMessaging.getToken();
          console.log("Token FCM:", token);
          // TODO: Aquí envías 'token' a tu servidor.
        } else {
          console.warn("Permiso de notificaciones denegado");
        }
      } catch (error) {
        console.error("Error al obtener el token FCM:", error);
      }
    };

    initializeNotifications();

    // 3. ESCUCHAR NOTIFICACIONES EN PRIMER PLANO: Se ejecuta cuando la app está abierta.
    const removeOnMessageListener = FirebaseMessaging.addListener(
      "notificationReceived",
      (payload) => {
        console.log("Notificación en primer plano:", payload);
      },
    );

    // 4. ESCUCHAR CUANDO EL USUARIO TOCA LA NOTIFICACIÓN: Permite navegar a una pantalla específica.
    const removeOnNotificationActionListener = FirebaseMessaging.addListener(
      "notificationActionPerformed",
      (event) => {
        console.log("Usuario abrió desde la notificación:", event);
      },
    );

    return () => {
      removeOnMessageListener;
      removeOnNotificationActionListener;
    };
  }, []);
};
