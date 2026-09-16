import type { BadgeTone } from "@/components/ui";
import { Plan } from "@/generated/prisma/enums";

/**
 * Planes de suscripción: tiers por cantidad de placas activas.
 *
 * Los taps son siempre ilimitados — cobrar por volumen de escaneos penaliza al
 * negocio justo cuando el producto más está funcionando, y un scan cuesta
 * centavos de infraestructura. Lo que sí cuesta dinero real es la placa
 * física, así que el eje comercial es cuántas placas tiene activas el
 * negocio, no cuántas veces las tocaron.
 *
 * Esta es la única fuente de verdad del modelo comercial: precio, límite de
 * placas, etiqueta y tono de UI se centralizan acá para que ROOT pueda
 * ajustar el negocio sin tocar media docena de archivos.
 */
export const PLAN_TAG_LIMITS: Record<Plan, number | null> = {
  LOCAL: 3,
  BUSINESS: 10,
  // Sin tope fijo: se negocia por sucursal y se carga en
  // `Business.includedTagsOverride`.
  CHAIN: null,
};

/**
 * Precio mensual de referencia, en dólares. Es la base de MRR/ARPU para las
 * métricas internas de ROOT.
 *
 * Para CHAIN es un piso, no un precio cerrado: la cuenta real se negocia por
 * sucursal. Usarlo en el cálculo de MRR subestima el ingreso real de esos
 * negocios en vez de sobrestimarlo, que es el lado seguro para no inflar la
 * cifra que ROOT usa para decidir.
 */
export const PLAN_PRICE_USD: Record<Plan, number> = {
  LOCAL: 9.99,
  BUSINESS: 19.99,
  CHAIN: 49.99,
};

export const PLAN_PRICE_LABELS: Record<Plan, string> = {
  LOCAL: `$${PLAN_PRICE_USD.LOCAL}/mes`,
  BUSINESS: `$${PLAN_PRICE_USD.BUSINESS}/mes`,
  CHAIN: `Desde $${PLAN_PRICE_USD.CHAIN}/mes`,
};

export const PLAN_LABELS: Record<Plan, string> = {
  LOCAL: "Local — hasta 3 placas",
  BUSINESS: "Business — hasta 10 placas",
  CHAIN: "Chain — multi-sucursal, a medida",
};

export const PLAN_TONES: Record<Plan, BadgeTone> = {
  LOCAL: "neutral",
  BUSINESS: "info",
  CHAIN: "success",
};

/** Qué trae cada plan, para la página de precios y el detalle del cliente. */
export const PLAN_FEATURES: Record<Plan, string[]> = {
  LOCAL: [
    "Hasta 3 placas activas",
    "NFC + QR, taps ilimitados",
    "Landing, menú, WhatsApp y redes",
    "Analytics básico",
  ],
  BUSINESS: [
    "Hasta 10 placas activas",
    "Taps ilimitados",
    "Analytics completo, por placa",
    "Dominio personalizado opcional",
  ],
  CHAIN: [
    "Placas y sucursales a medida",
    "Taps ilimitados",
    "Analytics comparado entre sucursales",
    "Dominio, sitio web y hosting incluidos",
  ],
};

/** A partir de este porcentaje se avisa al cliente y al equipo. */
export const WARNING_THRESHOLD = 0.8;

export type QuotaLevel = "OK" | "WARNING" | "EXCEEDED";

export type PlacaQuota = {
  /** Placas (tags) activas del negocio ahora mismo. */
  activeTags: number;
  /** Placas incluidas en el plan. `null` = sin tope fijo (a medida). */
  limit: number | null;
  level: QuotaLevel;
  /** Porcentaje de uso, 0–999. 0 si el plan no tiene tope. */
  percent: number;
  /** Placas disponibles antes de llegar al tope. `null` si no hay tope. */
  remaining: number | null;
};

/**
 * Calcula el estado de la cuota de placas de un negocio.
 *
 * Nunca bloquea nada por sí sola: es una función pura de lectura que alimenta
 * avisos comerciales, igual que el resto de las señales de la plataforma.
 */
export function quotaOf(activeTags: number, limit: number | null): PlacaQuota {
  if (limit === null) {
    return { activeTags, limit, level: "OK", percent: 0, remaining: null };
  }

  const ratio = activeTags / limit;
  const level: QuotaLevel =
    ratio >= 1 ? "EXCEEDED" : ratio >= WARNING_THRESHOLD ? "WARNING" : "OK";

  return {
    activeTags,
    limit,
    level,
    percent: Math.min(Math.round(ratio * 100), 999),
    remaining: Math.max(limit - activeTags, 0),
  };
}

/** Tope de placas de un negocio: su override a medida, o el de su plan. */
export function tagLimitFor(business: {
  plan: Plan;
  includedTagsOverride: number | null;
}): number | null {
  return business.includedTagsOverride ?? PLAN_TAG_LIMITS[business.plan];
}

/**
 * Costo de una placa física adicional.
 *
 * Es costo único de hardware e instalación, no un cargo recurrente: agregar
 * una placa no sube la cuota mensual por sí sola, aunque puede ser la señal
 * para conversar un upgrade de plan si el negocio ya usa todas las incluidas.
 */
export const ADDITIONAL_TAG_PRICE_LABEL = "$15 (costo único, instalación incluida)";

/** Orden de los tiers, para sugerir "el siguiente plan" cuando conviene. */
const PLAN_ORDER: Plan[] = [Plan.LOCAL, Plan.BUSINESS, Plan.CHAIN];

/** El plan que sigue en la escalera, o `null` si ya es el más alto (Chain). */
export function nextPlanUp(plan: Plan): Plan | null {
  const index = PLAN_ORDER.indexOf(plan);
  return index >= 0 && index < PLAN_ORDER.length - 1 ? PLAN_ORDER[index + 1] : null;
}
