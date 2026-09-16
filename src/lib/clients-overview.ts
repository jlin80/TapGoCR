import { Plan, ScanEventType } from "@/generated/prisma/enums";
import { placaQuotaFor, type QuotaLevel } from "@/lib/chips";
import { startOfLastZonedDays } from "@/lib/timezone";
import { prisma } from "@/lib/prisma";
import { TIMEZONE } from "@/lib/analytics";

/**
 * Datos consolidados de todos los clientes para la consola ROOT.
 *
 * Todo se resuelve con un puñado de consultas agregadas en lugar de una por
 * negocio: con cien clientes, el patrón ingenuo serían cientos de viajes a la
 * base en cada carga de la página.
 */

export type ClientRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: Date;
  users: number;
  tags: number;
  tagsActive: number;
  chips: number;
  plan: Plan;
  placaLimit: number | null;
  quotaLevel: QuotaLevel;
  scans30d: number;
  clicks30d: number;
  scansTotal: number;
  activeServices: number;
  openRequests: number;
  domains: number;
  lastActivity: Date | null;
};

export async function clientsComparison(days = 30): Promise<ClientRow[]> {
  const since = startOfLastZonedDays(TIMEZONE, days);

  const [businesses, recent, totals, lastSeen, chipCounts] = await Promise.all([
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        createdAt: true,
        plan: true,
        includedTagsOverride: true,
        _count: {
          select: { members: true, tags: true, domains: true },
        },
      },
    }),
    prisma.scanEvent.groupBy({
      by: ["businessId", "eventType"],
      where: { timestamp: { gte: since } },
      _count: { _all: true },
    }),
    prisma.scanEvent.groupBy({
      by: ["businessId"],
      where: { eventType: ScanEventType.SCAN },
      _count: { _all: true },
    }),
    prisma.scanEvent.groupBy({
      by: ["businessId"],
      _max: { timestamp: true },
    }),
    prisma.chip.groupBy({
      by: ["tagId"],
      where: { tag: { isNot: null } },
      _count: { _all: true },
    }),
  ]);

  const activeTags = await prisma.tag.groupBy({
    by: ["businessId"],
    where: { active: true },
    _count: { _all: true },
  });

  const activeServices = await prisma.businessService.groupBy({
    by: ["businessId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  const openRequests = await prisma.serviceRequest.groupBy({
    by: ["businessId"],
    where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING_CLIENT"] } },
    _count: { _all: true },
  });

  // Chips por negocio: hay que pasar por el tag, así que se resuelve con los
  // tags de cada negocio en lugar de otra consulta por chip.
  const tagsByBusiness = await prisma.tag.findMany({
    select: { id: true, businessId: true },
  });
  const businessByTag = new Map(tagsByBusiness.map((tag) => [tag.id, tag.businessId]));
  const chipsByBusiness = new Map<string, number>();
  for (const row of chipCounts) {
    if (!row.tagId) continue;
    const businessId = businessByTag.get(row.tagId);
    if (!businessId) continue;
    chipsByBusiness.set(businessId, (chipsByBusiness.get(businessId) ?? 0) + row._count._all);
  }

  const scansRecent = new Map<string, number>();
  const clicksRecent = new Map<string, number>();
  for (const row of recent) {
    const target = row.eventType === ScanEventType.SCAN ? scansRecent : clicksRecent;
    target.set(row.businessId, row._count._all);
  }

  const scansTotal = new Map(totals.map((r) => [r.businessId, r._count._all]));
  const last = new Map(lastSeen.map((r) => [r.businessId, r._max.timestamp]));
  const tagsActive = new Map(activeTags.map((r) => [r.businessId, r._count._all]));
  const services = new Map(activeServices.map((r) => [r.businessId, r._count._all]));
  const requests = new Map(openRequests.map((r) => [r.businessId, r._count._all]));

  return Promise.all(
    businesses.map(async (business) => {
      const quota = await placaQuotaFor(business);

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        active: business.active,
        createdAt: business.createdAt,
        users: business._count.members,
        tags: business._count.tags,
        tagsActive: tagsActive.get(business.id) ?? 0,
        chips: chipsByBusiness.get(business.id) ?? 0,
        plan: business.plan,
        placaLimit: quota.limit,
        quotaLevel: quota.level,
        scans30d: scansRecent.get(business.id) ?? 0,
        clicks30d: clicksRecent.get(business.id) ?? 0,
        scansTotal: scansTotal.get(business.id) ?? 0,
        activeServices: services.get(business.id) ?? 0,
        openRequests: requests.get(business.id) ?? 0,
        domains: business._count.domains,
        lastActivity: last.get(business.id) ?? null,
      };
    }),
  );
}
