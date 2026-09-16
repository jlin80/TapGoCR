import { EventSource, ScanEventType } from "@/generated/prisma/enums";
import {
  DEDUPE_WINDOW_MS,
  isBotUserAgent,
  visitorFingerprint,
} from "@/lib/bot-detection";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { buildRequestInfo } from "@/lib/request-info";

/**
 * Registro de eventos de analytics.
 *
 * Requisito explícito del producto: el tracking nunca puede impedir que la
 * landing cargue. Por eso esta función jamás propaga errores; si la escritura
 * falla se deja constancia en el log del servidor y la petición continúa.
 *
 * Antes de escribir se descarta el tráfico que no representa a una persona
 * frente a la placa: rastreadores, previsualizaciones de enlaces compartidos y
 * recargas inmediatas del mismo visitante. Ver `src/lib/bot-detection.ts` para
 * el porqué de cada criterio.
 */
export async function recordEvent(input: {
  businessId: string;
  tagId: string | null;
  eventType: ScanEventType;
  target?: string | null;
  source?: EventSource;
  headers: Headers;
}): Promise<void> {
  try {
    const info = buildRequestInfo(input.headers);

    if (!shouldRecord(input.eventType, input.tagId, info.userAgent, info.ipHash)) {
      return;
    }

    await prisma.scanEvent.create({
      data: {
        businessId: input.businessId,
        tagId: input.tagId,
        eventType: input.eventType,
        target: input.target ?? null,
        source: input.source ?? EventSource.TAP,
        userAgent: info.userAgent,
        referer: info.referer,
        ipHash: info.ipHash,
        country: info.country,
        deviceType: info.deviceType,
      },
    });
  } catch (error) {
    console.error("[tapgocr] no se pudo registrar el evento de analytics", error);
  }
}

/**
 * Decide si el evento representa a una persona real.
 *
 * Los dos filtros se aplican solo a SCAN. Un CLICK exige que alguien pulse un
 * botón: ningún rastreador llega ahí, y dos clics seguidos al mismo destino son
 * una interacción legítima que el cliente quiere ver contada.
 */
export function shouldRecord(
  eventType: ScanEventType,
  tagId: string | null,
  userAgent: string | null,
  ipHash: string | null,
): boolean {
  if (eventType !== ScanEventType.SCAN) return true;

  if (isBotUserAgent(userAgent)) return false;

  if (!tagId) return true;

  const fingerprint = visitorFingerprint(tagId, ipHash, userAgent);
  // Sin huella no se puede deduplicar sin castigar a visitantes distintos que
  // comparten la IP de salida de un local. En ese caso se registra.
  if (!fingerprint) return true;

  return rateLimit(`scan:${fingerprint}`, 1, DEDUPE_WINDOW_MS).allowed;
}
