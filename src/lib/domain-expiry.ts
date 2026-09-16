/**
 * Vencimiento de dominios.
 *
 * Que se venza el dominio de un cliente es el fallo mas caro y mas evitable de
 * este negocio: se cae su sitio, se cae su correo, y recuperar un dominio que
 * entro en periodo de redencion cuesta bastante mas que renovarlo.
 *
 * Modulo puro a proposito, sin acceso a base de datos: la logica de umbrales se
 * puede probar sin levantar nada.
 */
import { startOfZonedDay, zonedDateKey } from "@/lib/timezone";

/**
 * Dias antes del vencimiento en los que se avisa.
 *
 * Van de mayor a menor porque `stageFor` devuelve el primero que aplica: a 45
 * dias corresponde el umbral de 60 (ya cruzado) y no el de 30.
 *
 * El escalonado es deliberado. Un solo aviso se pierde entre el correo del dia;
 * cinco espaciados dan margen real para reaccionar, y el de 60 dias llega
 * cuando todavia se puede transferir el dominio a otro registrador si hiciera
 * falta (muchos registradores bloquean la transferencia en los ultimos 60 dias).
 */
export const NOTICE_DAYS = [60, 30, 14, 7, 1] as const;

/** Umbral que corresponde a un dominio ya vencido. */
export const EXPIRED_STAGE = 0;

export type ExpiryLevel = "OK" | "SOON" | "URGENT" | "EXPIRED";

export type ExpiryInfo = {
  /** Dias que faltan. Negativo si ya vencio. `null` sin fecha registrada. */
  daysLeft: number | null;
  level: ExpiryLevel;
  /** Umbral aplicable ahora, o `null` si todavia no toca avisar. */
  stage: number | null;
};

/** Zona horaria del negocio. La misma que usan los cortes de analytics. */
export const TIMEZONE = process.env.TAPGO_TIMEZONE || "America/Costa_Rica";

/**
 * Dias completos entre dos instantes, contados por fecha de calendario EN LA
 * ZONA DEL NEGOCIO.
 *
 * Dos motivos para no restar los instantes crudos ni usar UTC:
 *
 *   1. Sin normalizar a medianoche, un dominio que vence "manana a las 9"
 *      daria 0 dias a las 10 de hoy y el aviso de "vence manana" no saldria.
 *
 *   2. Normalizando en UTC, un vencimiento del 1 de septiembre a las 04:00 UTC
 *      es todavia el 31 de agosto en Costa Rica. El correo decia "vence manana:
 *      el 31 de agosto" el mismo 31 de agosto, porque el conteo usaba UTC y la
 *      fecha mostrada usaba la zona local. Se cuenta en la misma zona en la que
 *      se muestra, que ademas es la convencion que ya sigue analytics.
 */
export function daysUntil(expiresAt: Date, now: Date = new Date()): number {
  const day = 86_400_000;
  const midnight = (d: Date) => startOfZonedDay(TIMEZONE, zonedDateKey(TIMEZONE, d));

  return Math.round((midnight(expiresAt).getTime() - midnight(now).getTime()) / day);
}

/**
 * Umbral de aviso que corresponde a `daysLeft`, o `null` si todavia no toca.
 *
 * Es el umbral MAS ESTRECHO que ya se cruzo: a 30 dias corresponde el de 30, no
 * el de 60, aunque ambos se hayan cruzado. Por eso se recorre de menor a mayor.
 *
 * Recorrerlo al reves parece equivalente y no lo es: devolveria 60 para
 * cualquier plazo por debajo de 60 dias, con lo que `shouldNotify` daria falso
 * a partir del primer aviso y el escalonado no ocurriria nunca. El dominio
 * recibiria un unico correo y ninguno mas hasta vencer.
 */
export function stageFor(daysLeft: number): number | null {
  if (daysLeft < 0) return EXPIRED_STAGE;

  for (let i = NOTICE_DAYS.length - 1; i >= 0; i--) {
    const threshold = NOTICE_DAYS[i];
    if (daysLeft <= threshold) return threshold;
  }

  return null;
}

export function expiryInfo(
  expiresAt: Date | null,
  now: Date = new Date(),
): ExpiryInfo {
  if (!expiresAt) return { daysLeft: null, level: "OK", stage: null };

  const daysLeft = daysUntil(expiresAt, now);
  const stage = stageFor(daysLeft);

  const level: ExpiryLevel =
    daysLeft < 0 ? "EXPIRED" : daysLeft <= 14 ? "URGENT" : daysLeft <= 60 ? "SOON" : "OK";

  return { daysLeft, level, stage };
}

/**
 * Decide si hay que enviar un aviso ahora.
 *
 * Solo se avisa al cruzar un umbral nuevo, y "nuevo" significa mas cercano al
 * vencimiento que el ultimo enviado: los umbrales decrecen (60 → 30 → 14 → 7 →
 * 1 → 0), asi que un umbral menor es un aviso mas urgente. Sin esta condicion,
 * la tarea diaria mandaria el mismo correo todos los dias durante dos meses.
 */
export function shouldNotify(
  stage: number | null,
  lastNoticeStage: number | null,
): boolean {
  if (stage === null) return false;
  if (lastNoticeStage === null) return true;

  return stage < lastNoticeStage;
}

/** Texto del plazo, para el correo y para la consola. */
export function describeDeadline(daysLeft: number): string {
  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return overdue === 1 ? "vencio ayer" : `vencio hace ${overdue} dias`;
  }
  if (daysLeft === 0) return "vence hoy";
  if (daysLeft === 1) return "vence manana";
  return `vence en ${daysLeft} dias`;
}
