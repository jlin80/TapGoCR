import { type DiscordChannel, webhookFor } from "@/lib/discord/channels";

/**
 * Cliente de bajo nivel para webhooks de Discord.
 *
 * Regla no negociable: esto NUNCA debe tumbar ni retrasar de forma
 * perceptible una operación real de TapGoCR. Si Discord está caído, lento, o
 * devuelve cualquier error, acá se registra y se sigue — nunca se relanza la
 * excepción hacia quien llamó. Mismo criterio que `sendMail()` en
 * `src/lib/mailer.ts` y que `recordAudit()` en `src/lib/audit.ts`: devuelve
 * un resultado, nunca lanza.
 */

export type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
};

/** Botón de enlace. Discord solo admite botones de tipo "link" en webhooks. */
export type DiscordLinkButton = { label: string; url: string };

export type DiscordMessage = {
  /** Identificador propio del evento, para deduplicar reintentos y para logging. */
  eventId: string;
  content?: string;
  embeds?: DiscordEmbed[];
  buttons?: DiscordLinkButton[];
};

export type DiscordSendResult =
  | { sent: true; eventId: string; channel: DiscordChannel }
  | { sent: false; eventId: string; channel: DiscordChannel; reason: string };

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

// Longitudes máximas que Discord acepta para no arriesgar un 400 por payload
// inválido — se recorta antes de enviar en vez de dejar que Discord rechace.
const LIMITS = { title: 256, description: 4096, fieldValue: 1024, content: 2000 };

/**
 * Deduplicación en memoria del proceso: si el mismo `eventId` ya se mandó
 * (o está en curso) en los últimos 5 minutos, no se reenvía. No sobrevive un
 * reinicio ni se comparte entre los tres procesos Node del hosting — es
 * suficiente para el caso real que importa (una acción del usuario dispara
 * el evento una sola vez dentro de esa misma request), no para deduplicar
 * across-process a prueba de balas.
 */
const recentEventIds = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function alreadySent(eventId: string): boolean {
  const at = recentEventIds.get(eventId);
  const now = Date.now();

  if (at && now - at < DEDUPE_WINDOW_MS) return true;

  recentEventIds.set(eventId, now);
  // Limpieza perezosa: evita que el Map crezca sin límite en un proceso de
  // vida larga sin necesitar un temporizador aparte.
  if (recentEventIds.size > 500) {
    for (const [id, ts] of recentEventIds) {
      if (now - ts > DEDUPE_WINDOW_MS) recentEventIds.delete(id);
    }
  }
  return false;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Sanitiza texto antes de mandarlo a Discord: recorta longitud y neutraliza
 * menciones (@everyone, @here, roles) para que un asunto de correo o un
 * nombre de negocio no pueda disparar una mención masiva por accidente.
 */
export function sanitizeText(value: string, maxLength: number): string {
  const withoutMentions = value
    .replace(/@(everyone|here)/gi, "[mención]")
    .replace(/<@[!&]?\d+>/g, "[mención]");
  return truncate(withoutMentions.trim(), maxLength);
}

function sanitizeEmbed(embed: DiscordEmbed): DiscordEmbed {
  return {
    ...embed,
    title: truncate(embed.title, LIMITS.title),
    description: embed.description ? sanitizeText(embed.description, LIMITS.description) : undefined,
    fields: embed.fields?.map((field) => ({
      ...field,
      name: truncate(field.name, 256),
      value: sanitizeText(field.value, LIMITS.fieldValue),
    })),
  };
}

/** Los botones de un webhook van como un "action row" con componentes tipo link (estilo 5). */
function buildComponents(buttons: DiscordLinkButton[] | undefined) {
  if (!buttons || buttons.length === 0) return undefined;
  return [
    {
      type: 1,
      components: buttons.slice(0, 5).map((button) => ({
        type: 2,
        style: 5,
        label: truncate(button.label, 80),
        url: button.url,
      })),
    },
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envía un mensaje a un canal. Nunca lanza.
 *
 * - Reintenta con backoff en errores temporales (429, 500, 502, 503, timeout).
 * - Respeta `Retry-After` en 429.
 * - No reintenta errores permanentes (400, 401, 403, 404): los registra y corta.
 * - Deduplica por `eventId` dentro de la ventana de 5 minutos.
 */
export async function sendDiscordMessage(
  channel: DiscordChannel,
  message: DiscordMessage,
): Promise<DiscordSendResult> {
  const webhookUrl = webhookFor(channel);

  if (!webhookUrl) {
    return { sent: false, eventId: message.eventId, channel, reason: "channel_not_configured" };
  }

  if (alreadySent(message.eventId)) {
    return { sent: false, eventId: message.eventId, channel, reason: "duplicate_event" };
  }

  const payload = {
    content: message.content ? sanitizeText(message.content, LIMITS.content) : undefined,
    embeds: message.embeds?.map(sanitizeEmbed),
    components: buildComponents(message.buttons),
    // El webhook no necesita nombre/avatar propio: hereda el del canal, que
    // es lo que ya configuraron en Discord para cada uno.
    allowed_mentions: { parse: [] },
  };

  let lastReason = "unknown_error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        logDiscordEvent({ eventId: message.eventId, channel, status: "sent", attempt });
        return { sent: true, eventId: message.eventId, channel };
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : BASE_BACKOFF_MS * attempt;
        lastReason = "rate_limited";
        if (attempt < MAX_ATTEMPTS) {
          await sleep(Math.min(retryAfterMs, 10_000));
          continue;
        }
        break;
      }

      // Errores permanentes: no tiene sentido reintentar un 400/401/403/404.
      if (response.status >= 400 && response.status < 500) {
        lastReason = `client_error_${response.status}`;
        break;
      }

      // 5xx: temporal, reintenta con backoff exponencial.
      lastReason = `server_error_${response.status}`;
    } catch (error) {
      clearTimeout(timer);
      lastReason = error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error";
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }

  logDiscordEvent({
    eventId: message.eventId,
    channel,
    status: "failed",
    attempt: MAX_ATTEMPTS,
    reason: lastReason,
  });

  return { sent: false, eventId: message.eventId, channel, reason: lastReason };
}

/**
 * Observabilidad mínima: nunca registra la URL del webhook ni el contenido
 * del mensaje, solo metadatos del intento. Va a la consola (mismo destino
 * que el resto de errores de la app en este hosting, que no tiene un
 * sistema de logging centralizado aparte).
 */
function logDiscordEvent(entry: {
  eventId: string;
  channel: DiscordChannel;
  status: "sent" | "failed";
  attempt: number;
  reason?: string;
}): void {
  const line = `[discord] ${entry.status} channel=${entry.channel} event=${entry.eventId} attempt=${entry.attempt}${entry.reason ? ` reason=${entry.reason}` : ""}`;
  if (entry.status === "failed") console.error(line);
  else if (process.env.NODE_ENV === "development") console.log(line);
}
