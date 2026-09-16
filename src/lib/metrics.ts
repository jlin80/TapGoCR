import { TIMEZONE } from "@/lib/analytics";
import { PLAN_PRICE_USD } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { startOfZonedDay, zonedDateKey } from "@/lib/timezone";

/**
 * Métricas internas de negocio para ROOT: MRR, ARR, churn, activación,
 * retención.
 *
 * Todo sale de datos que la plataforma ya registra — nada se estima ni se
 * inventa. Dos límites explícitos, documentados donde corresponde:
 *
 * 1. MRR/ARR/ARPU usan `PLAN_PRICE_USD` como precio de referencia por tier.
 *    Para CHAIN es un piso: la cuenta real se negocia por sucursal, así que
 *    estas cifras pueden subestimar (nunca sobrestimar) el ingreso real.
 * 2. Churn y reactivación dependen de `AuditLog` (acciones
 *    `BUSINESS_DEACTIVATED`/`BUSINESS_REACTIVATED`, registradas desde
 *    setiembre 2026). Un negocio desactivado antes de esa fecha no aparece
 *    como churn: no hay evento histórico que lo respalde, y es preferible
 *    mostrar cero que inventar una fecha.
 */

export type GrowthMetrics = {
  mrrUsd: number;
  arrUsd: number;
  arpuUsd: number;
  activeClients: number;
  totalClients: number;
  newClientsThisMonth: number;
  churnedThisMonth: number;
  activePlacas: number;
  /** % de negocios que alguna vez recibieron al menos un scan. */
  activationRate: number;
  /** % de negocios dados de alta hace más de N días que siguen activos. */
  retention: { d30: number; d60: number; d90: number };
};

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  const monthStart = startOfCurrentMonth();

  const [
    businesses,
    activeTags,
    businessesWithScans,
    deactivatedThisMonth,
  ] = await Promise.all([
    prisma.business.findMany({
      select: { id: true, plan: true, active: true, createdAt: true },
    }),
    prisma.tag.count({ where: { active: true } }),
    prisma.scanEvent.groupBy({ by: ["businessId"], _count: { _all: true } }),
    prisma.auditLog.count({
      where: { action: "BUSINESS_DEACTIVATED", createdAt: { gte: monthStart } },
    }),
  ]);

  const activeBusinesses = businesses.filter((b) => b.active);
  const mrrUsd = round2(
    activeBusinesses.reduce((sum, b) => sum + PLAN_PRICE_USD[b.plan], 0),
  );

  const newClientsThisMonth = businesses.filter((b) => b.createdAt >= monthStart).length;

  const now = Date.now();
  const olderThan = (days: number) => (b: { createdAt: Date }) =>
    now - b.createdAt.getTime() >= days * 24 * 60 * 60 * 1000;

  const retentionAt = (days: number): number => {
    const cohort = businesses.filter(olderThan(days));
    if (cohort.length === 0) return 100;
    const stillActive = cohort.filter((b) => b.active).length;
    return Math.round((stillActive / cohort.length) * 100);
  };

  return {
    mrrUsd,
    arrUsd: round2(mrrUsd * 12),
    arpuUsd: activeBusinesses.length > 0 ? round2(mrrUsd / activeBusinesses.length) : 0,
    activeClients: activeBusinesses.length,
    totalClients: businesses.length,
    newClientsThisMonth,
    churnedThisMonth: deactivatedThisMonth,
    activePlacas: activeTags,
    activationRate:
      businesses.length > 0
        ? Math.round((businessesWithScans.length / businesses.length) * 100)
        : 0,
    retention: {
      d30: retentionAt(30),
      d60: retentionAt(60),
      d90: retentionAt(90),
    },
  };
}

/** Inicio del mes calendario vigente, en la zona horaria del negocio. */
function startOfCurrentMonth(): Date {
  const [year, month] = zonedDateKey(TIMEZONE).split("-");
  return startOfZonedDay(TIMEZONE, `${year}-${month}-01`);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
