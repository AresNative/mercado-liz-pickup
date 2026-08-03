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
 * api-mongodb (POST /api/whatsapp), que a su vez usa Twilio.
 *
 * No lanza si falla: una notificación fallida no debe tumbar el checkout,
 * el pedido ya quedó guardado. El error se registra en consola.
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

  const to = toE164Mexico(params.telefono);
  if (!to) {
    console.warn("Teléfono inválido para WhatsApp:", params.telefono);
    return false;
  }

  const nombre = params.nombre ? ` ${params.nombre}` : "";
  const cuando =
    params.fechaEntrega && params.horaEntrega
      ? ` para el ${params.fechaEntrega} a las ${params.horaEntrega}`
      : "";

  const body =
    `¡Hola${nombre}! Tu pedido #${params.pedidoId} en Mercado Liz Pick-Up ` +
    `fue confirmado${cuando}. Te avisaremos por aquí cuando esté listo. ` +
    `Puedes ver el estado en https://pick-up.mercadosliz.com/seguimiento`;

  try {
    const response = await fetch(`${apiMongoDb}/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, body }),
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
 * backend api-mongodb (POST /api/push). Útil para avisar, por ejemplo,
 * al equipo de la sucursal que llegó un pedido nuevo.
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
