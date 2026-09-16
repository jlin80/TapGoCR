import { mailerConfigured, sendMail, type MailMessage } from "@/lib/mailer";

/**
 * Capa de resiliencia sobre `mailer.ts` (el adapter SMTP real, sin tocar).
 * `sendMail()` ya no lanza y ya se apaga sola sin SMTP configurado; esto le
 * agrega reintentos para errores temporales y deduplicación por
 * `notificationId` — mismo criterio que `DiscordNotificationService`, para
 * que los dos canales se comporten igual y ninguno bloquee a TapGoCR.
 */

export type EmailNotification = MailMessage & {
  /** Identificador propio de esta notificación, para deduplicar reintentos. */
  notificationId: string;
  /** Nombre del template usado, solo para logging (nunca el contenido completo). */
  template: string;
};

export type EmailSendResult =
  | { sent: true; notificationId: string }
  | { sent: false; notificationId: string; reason: string };

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

const recentNotificationIds = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function alreadySent(id: string): boolean {
  const at = recentNotificationIds.get(id);
  const now = Date.now();
  if (at && now - at < DEDUPE_WINDOW_MS) return true;

  recentNotificationIds.set(id, now);
  if (recentNotificationIds.size > 500) {
    for (const [key, ts] of recentNotificationIds) {
      if (now - ts > DEDUPE_WINDOW_MS) recentNotificationIds.delete(key);
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Errores de SMTP que vale la pena reintentar (transitorios de red/servidor). */
function isTemporary(reason: string): boolean {
  const lower = reason.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("greylist") ||
    /^4\d\d\b/.test(lower) // códigos SMTP 4xx: error temporal
  );
}

/**
 * Envía una notificación por correo. Nunca lanza.
 *
 * Si SMTP no está configurado, `sendMail()` lo informa de una y acá no se
 * reintenta — reintentar una configuración faltante no la arregla.
 */
export async function sendEmailNotification(message: EmailNotification): Promise<EmailSendResult> {
  if (!mailerConfigured()) {
    logEmailEvent({ notificationId: message.notificationId, template: message.template, status: "skipped", reason: "smtp_not_configured" });
    return { sent: false, notificationId: message.notificationId, reason: "smtp_not_configured" };
  }

  if (alreadySent(message.notificationId)) {
    return { sent: false, notificationId: message.notificationId, reason: "duplicate_notification" };
  }

  let lastReason = "unknown_error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await sendMail(message);

    if (result.sent) {
      logEmailEvent({
        notificationId: message.notificationId,
        template: message.template,
        status: "sent",
        attempt,
      });
      return { sent: true, notificationId: message.notificationId };
    }

    lastReason = result.reason;

    if (!isTemporary(lastReason) || attempt === MAX_ATTEMPTS) break;
    await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
  }

  logEmailEvent({
    notificationId: message.notificationId,
    template: message.template,
    status: "failed",
    attempt: MAX_ATTEMPTS,
    reason: lastReason,
  });

  return { sent: false, notificationId: message.notificationId, reason: lastReason };
}

/**
 * Observabilidad mínima: destinatario, template y estado — nunca el asunto
 * ni el cuerpo del correo (podría llevar datos de un cliente).
 */
function logEmailEvent(entry: {
  notificationId: string;
  template: string;
  status: "sent" | "failed" | "skipped";
  attempt?: number;
  reason?: string;
}): void {
  const line = `[email] ${entry.status} template=${entry.template} notification=${entry.notificationId}${entry.attempt ? ` attempt=${entry.attempt}` : ""}${entry.reason ? ` reason=${entry.reason}` : ""}`;
  if (entry.status === "failed") console.error(line);
  else if (process.env.NODE_ENV === "development") console.log(line);
}
