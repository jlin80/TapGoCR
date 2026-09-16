import type { BadgeTone } from "@/components/ui";
import { Plan } from "@/generated/prisma/enums";
import { PLANS as PUBLIC_PLANS, type PublicPlan } from "@/lib/offers";

/**
 * Puente entre el enum de base de datos (`Plan`: LOCAL/BUSINESS/CHAIN — no se
 * toca, cambiar valores de enum es una migración innecesaria para un cambio
 * que es puramente de nombre) y el modelo comercial público real
 * (`src/lib/offers.ts`: Starter/Business/Pro, en colones).
 *
 * Antes existían dos fuentes de verdad que ya no coincidían: esta tabla y
 * `PLAN_PRICE_USD` en dólares acá, y `Starter/Business/Pro` en colones en la
 * home. Un cliente en `Plan.LOCAL` se mostraba como "Local" en el panel de
 * ROOT mientras la web pública ya no ofrecía nada llamado "Local". Ahora todo
 * lo que ve ROOT, el cliente y la web pública sale de `offers.ts`.
 */
const PLAN_TO_OFFER: Record<Plan, PublicPlan["slug"]> = {
  LOCAL: "starter",
  BUSINESS: "business",
  CHAIN: "pro",
};

function offerFor(plan: Plan): PublicPlan {
  const offer = PUBLIC_PLANS.find((item) => item.slug === PLAN_TO_OFFER[plan]);
  if (!offer) throw new Error(`Sin oferta pública para el plan ${plan}.`);
  return offer;
}

/**
 * Placas incluidas por plan. Ya no admite `null` ("sin tope"): el modelo
 * público no vende ningún plan sin límite base, Pro incluye 8 y de ahí se
 * compran placas adicionales — igual que Starter y Business. Un negocio que
 * de verdad necesita más (cadenas, contratos a medida) se resuelve con
 * `Business.includedTagsOverride`, que sigue existiendo sin cambios.
 */
export const PLAN_TAG_LIMITS: Record<Plan, number> = {
  LOCAL: offerFor(Plan.LOCAL).points,
  BUSINESS: offerFor(Plan.BUSINESS).points,
  CHAIN: offerFor(Plan.CHAIN).points,
};

/** Mensualidad real en colones, para MRR/ARPU interno de ROOT — ya no una cifra en dólares que nadie cobra. */
export const PLAN_MONTHLY_CRC: Record<Plan, number> = {
  LOCAL: offerFor(Plan.LOCAL).monthlyPriceCrc,
  BUSINESS: offerFor(Plan.BUSINESS).monthlyPriceCrc,
  CHAIN: offerFor(Plan.CHAIN).monthlyPriceCrc,
};

export const PLAN_PRICE_LABELS: Record<Plan, string> = {
  LOCAL: `${offerFor(Plan.LOCAL).monthlyPrice}/mes`,
  BUSINESS: `${offerFor(Plan.BUSINESS).monthlyPrice}/mes`,
  CHAIN: `${offerFor(Plan.CHAIN).monthlyPrice}/mes`,
};

/** Nombre corto, para badges y celdas de tabla — igual al que ve el cliente en la web pública. */
export const PLAN_LABELS: Record<Plan, string> = {
  LOCAL: offerFor(Plan.LOCAL).name,
  BUSINESS: offerFor(Plan.BUSINESS).name,
  CHAIN: offerFor(Plan.CHAIN).name,
};

export const PLAN_TONES: Record<Plan, BadgeTone> = {
  LOCAL: "neutral",
  BUSINESS: "info",
  CHAIN: "success",
};

/** Qué trae cada plan, para el detalle del cliente en el panel de ROOT — mismas features que la web pública. */
export const PLAN_FEATURES: Record<Plan, string[]> = {
  LOCAL: offerFor(Plan.LOCAL).features,
  BUSINESS: offerFor(Plan.BUSINESS).features,
  CHAIN: offerFor(Plan.CHAIN).features,
};

/** A partir de este porcentaje se avisa al cliente y al equipo. */
export const WARNING_THRESHOLD = 0.8;

export type QuotaLevel = "OK" | "WARNING" | "EXCEEDED";

export type PlacaQuota = {
  /** Placas (tags) activas del negocio ahora mismo. */
  activeTags: number;
  /** Placas incluidas en el plan (o el override del negocio). */
  limit: number;
  level: QuotaLevel;
  /** Porcentaje de uso, 0–999. */
  percent: number;
  /** Placas disponibles antes de llegar al tope. */
  remaining: number;
};

/**
 * Calcula el estado de la cuota de placas de un negocio.
 *
 * Nunca bloquea nada por sí sola: es una función pura de lectura que alimenta
 * avisos comerciales, igual que el resto de las señales de la plataforma. Un
 * negocio que ya tenía más placas activas que su nuevo límite (por el ajuste
 * de cuotas de este cambio) simplemente aparece en "EXCEEDED" — es una señal
 * comercial para conversar un upgrade o una placa adicional, nunca un corte
 * de servicio.
 */
export function quotaOf(activeTags: number, limit: number): PlacaQuota {
  const ratio = limit > 0 ? activeTags / limit : activeTags > 0 ? Infinity : 0;
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
}): number {
  return business.includedTagsOverride ?? PLAN_TAG_LIMITS[business.plan];
}

/**
 * Costo de una placa física adicional — pago único, distinto por plan (el
 * mismo número que ya ve el cliente en la página de precios pública).
 */
export function additionalTagPriceLabel(plan: Plan): string {
  return `${offerFor(plan).additionalPointPrice} (costo único, instalación incluida)`;
}

/** Orden de los tiers, para sugerir "el siguiente plan" cuando conviene. */
const PLAN_ORDER: Plan[] = [Plan.LOCAL, Plan.BUSINESS, Plan.CHAIN];

/** El plan que sigue en la escalera, o `null` si ya es el más alto (Pro). */
export function nextPlanUp(plan: Plan): Plan | null {
  const index = PLAN_ORDER.indexOf(plan);
  return index >= 0 && index < PLAN_ORDER.length - 1 ? PLAN_ORDER[index + 1] : null;
}
