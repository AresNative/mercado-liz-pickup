// src/utils/functions/notify.ts
import { EnvConfig } from "@/utils/constants/env.config";

const { apiMongoDb } = EnvConfig();

/**
 * Convierte un número de teléfono mexicano de 10 dígitos (como se captura
 * en el formulario de checkout) a formato E.164 (+52XXXXXXXXXX) requerido
 * por la API de WhatsApp de Twilio.
 */
function toE164Mexico(rawPhone: string): string | null {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return `+${digits}`;
  if (rawPhone?.startsWith("+")) return rawPhone;
  return null;
}

/**
 * Envía la confirmación de un pedido por WhatsApp usando el backend
 * api-mongodb (POST /api/whatsapp). Utiliza una plantilla de contenido
 * aprobada (Content SID: HX40a1522b0f3dba8774a841bfb0ea3ba5).
 */
export async function sendOrderWhatsAppConfirmation(params: {
  telefono: string;
  nombre?: string;
  pedidoId: string | number;
  fechaEntrega?: string;
  horaEntrega?: string;
}): Promise<boolean> {
  if (!apiMongoDb) {
    console.warn("VITE_MONGO_API_URL no configurado; se omite WhatsApp.");
    return false;
  }

  const to = `whatsapp:${toE164Mexico(params.telefono)}`;
  if (!to) {
    console.warn("Teléfono inválido para WhatsApp:", params.telefono);
    return false;
  }

  const nombre = params.nombre || "";
  const pedidoId = String(params.pedidoId);
  const cuando =
    params.fechaEntrega && params.horaEntrega
      ? `para el ${params.fechaEntrega} a las ${params.horaEntrega}`
      : "";

  const contentVariables = {
    "1": nombre,
    "2": pedidoId,
    "3": cuando,
  };

  try {
    const response = await fetch(`${apiMongoDb}/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        contentSid: "HX40a1522b0f3dba8774a841bfb0ea3ba5",
        contentVariables, // <-- ahora es un objeto
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error al enviar confirmación por WhatsApp:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error de red al enviar confirmación por WhatsApp:", error);
    return false;
  }
}

/**
 * Envía una notificación push directa a un token FCM concreto usando el
 * backend api-mongodb (POST /api/push).
 */
export async function sendPushToToken(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<boolean> {
  if (!apiMongoDb) return false;

  try {
    const response = await fetch(`${apiMongoDb}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return response.ok;
  } catch (error) {
    console.error("Error de red al enviar push:", error);
    return false;
  }
}
