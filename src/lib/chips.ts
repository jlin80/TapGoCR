import { Plan } from "@/generated/prisma/enums";
import { quotaOf, tagLimitFor, type PlacaQuota } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export type { PlacaQuota, QuotaLevel } from "@/lib/plans";
export { quotaOf } from "@/lib/plans";

/**
 * Cuota de placas del plan de suscripción.
 *
 * La cuota es de cantidad de placas activas, no de taps: un NTAG213/215/216
 * admite lecturas ilimitadas y así se cobra — el límite es comercial (cuánto
 * hardware tiene instalado el negocio), nunca del volumen de escaneos.
 */

/** Placas (tags) activas de un negocio ahora mismo. */
export async function activeTagsForBusiness(businessId: string): Promise<number> {
  return prisma.tag.count({ where: { businessId, active: true } });
}

/** Cuota de placas vigente de un negocio, con las activas ya contadas. */
export async function placaQuotaFor(business: {
  id: string;
  plan: Plan;
  includedTagsOverride: number | null;
}): Promise<PlacaQuota> {
  const activeTags = await activeTagsForBusiness(business.id);
  return quotaOf(activeTags, tagLimitFor(business));
}

/**
 * Cuota de placas de todos los negocios en una sola pasada.
 *
 * Usado por la consola ROOT para la bandeja de atención y la comparativa de
 * clientes: evita repetir una consulta de `Tag` por negocio.
 */
export async function placaQuotaOverview(): Promise<
  Map<string, PlacaQuota & { businessName: string }>
> {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, plan: true, includedTagsOverride: true },
  });

  const activeCounts = await prisma.tag.groupBy({
    by: ["businessId"],
    where: { active: true },
    _count: { _all: true },
  });
  const activeByBusiness = new Map(activeCounts.map((r) => [r.businessId, r._count._all]));

  const rows = businesses.map((business) => {
    const quota = quotaOf(activeByBusiness.get(business.id) ?? 0, tagLimitFor(business));
    return [business.id, { ...quota, businessName: business.name }] as const;
  });

  return new Map(rows);
}

/** Chips de un negocio, sin cuota: es inventario de hardware, no de consumo. */
export function chipsForBusiness(businessId: string) {
  return prisma.chip.findMany({
    where: { tag: { businessId } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      uid: true,
      model: true,
      status: true,
      tag: { select: { id: true, name: true, code: true, active: true } },
    },
  });
}
