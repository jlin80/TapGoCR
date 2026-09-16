import { rateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { extractClientIp } from "@/lib/request-info";

/**
 * Límite de envíos para los formularios abiertos al público.
 *
 * Dos decisiones que conviene entender:
 *
 * **Se usa la IP en crudo, no su hash.** El hash existe para lo que se *guarda*
 * en la base; acá el valor vive solo en memoria y nunca se persiste. Además el
 * hash es `null` cuando no hay sal configurada, y usarlo como clave metería a
 * todo el mundo en el mismo cupo.
 *
 * **Sin IP no se bloquea a todos.** Si el reverse proxy no reenvía
 * `X-Forwarded-For`, no hay forma de distinguir a una persona de otra. Aplicar
 * el cupo individual a todo el tráfico junto dejaría el formulario inservible
 * tras unos pocos envíos: es peor que el abuso que se quiere evitar. En ese caso
 * se usa un cupo global mucho más amplio, que acota el abuso sin cerrarle la
 * puerta a nadie.
 */
const GLOBAL_MULTIPLIER = 20;

export type PublicLimit = RateLimitResult & {
  /** `false` cuando no se pudo identificar el origen y se usó el cupo global. */
  perIp: boolean;
};

export function limitPublicSubmission(options: {
  kind: string;
  headers: Headers;
  limit: number;
  windowMs: number;
}): PublicLimit {
  const ip = extractClientIp(options.headers);

  if (ip) {
    return { ...rateLimit(`${options.kind}:ip:${ip}`, options.limit, options.windowMs), perIp: true };
  }

  const result = rateLimit(
    `${options.kind}:global`,
    options.limit * GLOBAL_MULTIPLIER,
    options.windowMs,
  );

  if (!result.allowed) {
    console.warn(
      `[tapgocr] cupo global de "${options.kind}" agotado. Es señal de que el ` +
        "reverse proxy no está reenviando X-Forwarded-For.",
    );
  }

  return { ...result, perIp: false };
}
