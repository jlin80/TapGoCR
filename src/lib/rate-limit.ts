/**
 * Limitador de tasa en memoria, por proceso.
 *
 * Suficiente para un despliegue de un solo nodo, que es el objetivo del MVP en
 * VPS. Si en el futuro TapGoCR corre en varias instancias, este módulo debe
 * cambiarse por un almacén compartido (Redis) sin tocar a quienes lo llaman.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Purga perezosa: se limpia al consultar en lugar de mantener un temporizador,
// para no retener el proceso vivo ni acumular entradas vencidas sin límite.
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) purgeExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

export function resetRateLimit(key?: string): void {
  if (key) buckets.delete(key);
  else buckets.clear();
}

function purgeExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
