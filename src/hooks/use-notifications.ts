// src/hooks/use-notifications.ts
import { useEffect } from "react";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { isPlatform } from "@ionic/react";
import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { apiMongoDb } = EnvConfig();

/**
 * Envía el token FCM del dispositivo al backend (api-mongodb) para que
 * quede registrado y se puedan dirigir notificaciones push a este usuario.
 * Ver POST /api/push-tokens en api-mongodb.
 */
async function registerTokenOnBackend(token: string) {
  if (!apiMongoDb) {
    console.warn(
      "VITE_MONGO_API_URL no está configurado; no se pudo registrar el token FCM.",
    );
    return;
  }

  try {
    const userId = getLocalStorageItem("user-id");

    await fetch(`${apiMongoDb}/api/push-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        userId: userId ?? null,
        platform: isPlatform("android")
          ? "android"
          : isPlatform("ios")
            ? "ios"
            : "web",
      }),
    });
  } catch (error) {
    console.error("Error al registrar el token FCM en el backend:", error);
  }
}

export const usePushNotifications = () => {
  useEffect(() => {
    if (!isPlatform("android")) return;

    const initializeNotifications = async () => {
      try {
        // 1. SOLICITAR PERMISO: El usuario debe aceptar recibir notificaciones.
        const permission = await FirebaseMessaging.requestPermissions();

        if (permission.receive === "granted") {
          console.log("Permiso de notificaciones concedido");

          // 2. REGISTRAR Y OBTENER TOKEN: Este token identifica de forma única el dispositivo.
          const { token } = await FirebaseMessaging.getToken();
          console.log("Token FCM:", token);

          // 3. Enviar el token al backend para poder notificar a este dispositivo.
          if (token) await registerTokenOnBackend(token);
        } else {
          console.warn("Permiso de notificaciones denegado");
        }
      } catch (error) {
        console.error("Error al obtener el token FCM:", error);
      }
    };

    initializeNotifications();

    // 4. ESCUCHAR NOTIFICACIONES EN PRIMER PLANO: Se ejecuta cuando la app está abierta.
    const onMessageListener = FirebaseMessaging.addListener(
      "notificationReceived",
      (payload) => {
        console.log("Notificación en primer plano:", payload);
      },
    );

    // 5. ESCUCHAR CUANDO EL USUARIO TOCA LA NOTIFICACIÓN: Permite navegar a una pantalla específica.
    const onNotificationActionListener = FirebaseMessaging.addListener(
      "notificationActionPerformed",
      (event) => {
        console.log("Usuario abrió desde la notificación:", event);
        const data = event.notification?.data as
          | Record<string, string>
          | undefined;
        const targetUrl = data?.url;
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      },
    );

    // 6. Si el token se renueva (reinstalación, restauración, etc.), re-registrarlo.
    const onTokenRefreshListener = FirebaseMessaging.addListener(
      "tokenReceived",
      (event) => {
        if (event.token) registerTokenOnBackend(event.token);
      },
    );

    return () => {
      onMessageListener.then((sub) => sub.remove());
      onNotificationActionListener.then((sub) => sub.remove());
      onTokenRefreshListener.then((sub) => sub.remove());
    };
  }, []);
};
