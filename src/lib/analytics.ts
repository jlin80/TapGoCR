import { DeviceType, ScanEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { lastZonedDays, startOfLastZonedDays, zonedDateKey } from "@/lib/timezone";

/**
 * Consultas de analytics.
 *
 * Ninguna de estas funciones comprueba permisos: se asume que quien las llama ya
 * pasó por `src/lib/authz.ts` y que `businessId` es un negocio autorizado.
 *
 * Las agregaciones por día se hacen en la zona horaria del negocio, no en UTC:
 * de lo contrario "hoy" cambiaría a las 6 p. m. hora de Costa Rica.
 */
export const TIMEZONE = process.env.TAPGO_TIMEZONE || "America/Costa_Rica";

export type DailyPoint = { date: string; scans: number; clicks: number };
export type Breakdown = { key: string; label: string; count: number };

export type BusinessSummary = {
  scansToday: number;
  scans7d: number;
  scans30d: number;
  clicks30d: number;
  clicksTotal: number;
  scansTotal: number;
  tagsTotal: number;
  tagsActive: number;
};

export async function getBusinessSummary(businessId: string): Promise<BusinessSummary> {
  // Dos agrupaciones por tipo de evento cubren cuatro de las cifras, en lugar
  // de un `count` por cada una. Menos consultas simultáneas es menos presión
  // sobre el pool de conexiones.
  const [historic, recent, scans7d, scansToday, tags] = await Promise.all([
    prisma.scanEvent.groupBy({
      by: ["eventType"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.scanEvent.groupBy({
      by: ["eventType"],
      where: { businessId, timestamp: { gte: calendarDaysAgo(30) } },
      _count: { _all: true },
    }),
    countEvents(businessId, ScanEventType.SCAN, calendarDaysAgo(7)),
    countEvents(businessId, ScanEventType.SCAN, calendarDaysAgo(1)),
    prisma.tag.groupBy({
      by: ["active"],
      where: { businessId },
      _count: { _all: true },
    }),
  ]);

  const pick = (
    rows: Array<{ eventType: ScanEventType; _count: { _all: number } }>,
    type: ScanEventType,
  ) => rows.find((row) => row.eventType === type)?._count._all ?? 0;

  const tagsActive = tags.find((row) => row.active)?._count._all ?? 0;
  const tagsInactive = tags.find((row) => !row.active)?._count._all ?? 0;

  return {
    scansToday,
    scans7d,
    scans30d: pick(recent, ScanEventType.SCAN),
    clicks30d: pick(recent, ScanEventType.CLICK),
    clicksTotal: pick(historic, ScanEventType.CLICK),
    scansTotal: pick(historic, ScanEventType.SCAN),
    tagsTotal: tagsActive + tagsInactive,
    tagsActive,
  };
}

function countEvents(
  businessId: string,
  eventType: ScanEventType,
  since?: Date,
): Promise<number> {
  return prisma.scanEvent.count({
    where: {
      businessId,
      eventType,
      ...(since ? { timestamp: { gte: since } } : {}),
    },
  });
}

/**
 * Serie diaria de scans y clicks. Devuelve todos los días del rango, incluidos
 * los que no tuvieron actividad, para que la gráfica no se deforme.
 */
export async function getDailySeries(
  businessId: string,
  days: number,
): Promise<DailyPoint[]> {
  // El corte por día se hace en JS con `zonedDateKey` (la misma lógica ya
  // probada en `src/lib/timezone.ts`), no con SQL: `date_trunc`/`AT TIME ZONE`
  // son sintaxis de PostgreSQL y no existen en otros motores. El volumen de
  // eventos de un negocio en `days` días es chico, así que traer las filas y
  // agrupar en memoria es más simple que mantener dos implementaciones del
  // mismo corte de zona horaria (una en SQL, otra en JS) sincronizadas.
  const rows = await prisma.scanEvent.findMany({
    where: {
      businessId,
      timestamp: { gte: calendarDaysAgo(days) },
    },
    select: { timestamp: true, eventType: true },
  });

  const byDay = new Map<string, { scans: number; clicks: number }>();
  for (const row of rows) {
    const key = zonedDateKey(TIMEZONE, row.timestamp);
    const entry = byDay.get(key) ?? { scans: 0, clicks: 0 };
    if (row.eventType === ScanEventType.SCAN) entry.scans += 1;
    else entry.clicks += 1;
    byDay.set(key, entry);
  }

  // Las claves salen de la misma zona horaria que usa `zonedDateKey`, así que
  // ningún día del rango se queda fuera de la serie.
  return lastZonedDays(TIMEZONE, days).map((date) => ({
    date,
    ...(byDay.get(date) ?? { scans: 0, clicks: 0 }),
  }));
}

/** Clicks agrupados por destino (MENU, WHATSAPP, …). */
export async function getClicksByTarget(
  businessId: string,
  days = 30,
): Promise<Breakdown[]> {
  const rows = await prisma.scanEvent.groupBy({
    by: ["target"],
    where: {
      businessId,
      eventType: ScanEventType.CLICK,
      timestamp: { gte: calendarDaysAgo(days) },
    },
    _count: { _all: true },
    orderBy: { _count: { target: "desc" } },
  });

  return rows
    .filter((row) => row.target !== null)
    .map((row) => ({
      key: row.target as string,
      label: TARGET_LABELS[row.target as string] ?? (row.target as string),
      count: row._count._all,
    }));
}

/** Scans agrupados por tag, con el nombre legible del tag. */
export async function getScansByTag(
  businessId: string,
  days = 30,
): Promise<Breakdown[]> {
  const [rows, tags] = await Promise.all([
    prisma.scanEvent.groupBy({
      by: ["tagId"],
      where: {
        businessId,
        eventType: ScanEventType.SCAN,
        timestamp: { gte: calendarDaysAgo(days) },
      },
      _count: { _all: true },
    }),
    prisma.tag.findMany({
      where: { businessId },
      select: { id: true, name: true },
    }),
  ]);

  const names = new Map(tags.map((tag) => [tag.id, tag.name]));

  return rows
    .map((row) => ({
      key: row.tagId ?? "unknown",
      label: row.tagId ? (names.get(row.tagId) ?? "Tag eliminado") : "Sin tag",
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

export type ValueSummary = {
  days: number;
  scans: number;
  clicks: number;
  interactions: number;
  /** Clics por cada 100 scans. `null` si no hubo scans en el período. */
  ctr: number | null;
  /** % de cambio en interacciones contra el período anterior de igual largo.
   * `null` si el período anterior no tuvo actividad: comparar contra cero no
   * es un porcentaje con sentido, así que mejor no mostrar nada. */
  trend: number | null;
};

/**
 * Resumen de valor del período, para responder "¿de verdad está funcionando
 * TapGo?" con una sola cifra y su tendencia, en vez de una tabla de números
 * sueltos. Es la base de "Tu TapGo este mes" en ambos paneles.
 */
export async function getValueSummary(businessId: string, days = 30): Promise<ValueSummary> {
  const currentStart = calendarDaysAgo(days);
  const previousStart = calendarDaysAgo(days * 2);

  const [currentRows, previousRows] = await Promise.all([
    prisma.scanEvent.groupBy({
      by: ["eventType"],
      where: { businessId, timestamp: { gte: currentStart } },
      _count: { _all: true },
    }),
    prisma.scanEvent.groupBy({
      by: ["eventType"],
      where: { businessId, timestamp: { gte: previousStart, lt: currentStart } },
      _count: { _all: true },
    }),
  ]);

  const pick = (
    rows: Array<{ eventType: ScanEventType; _count: { _all: number } }>,
    type: ScanEventType,
  ) => rows.find((row) => row.eventType === type)?._count._all ?? 0;

  const scans = pick(currentRows, ScanEventType.SCAN);
  const clicks = pick(currentRows, ScanEventType.CLICK);
  const interactions = scans + clicks;
  const previousInteractions =
    pick(previousRows, ScanEventType.SCAN) + pick(previousRows, ScanEventType.CLICK);

  return {
    days,
    scans,
    clicks,
    interactions,
    ctr: scans > 0 ? Math.round((clicks / scans) * 100) : null,
    trend:
      previousInteractions > 0
        ? Math.round(((interactions - previousInteractions) / previousInteractions) * 100)
        : null,
  };
}

/** Reparto de dispositivos sobre los scans del período. */
export async function getDeviceBreakdown(
  businessId: string,
  days = 30,
): Promise<Breakdown[]> {
  const rows = await prisma.scanEvent.groupBy({
    by: ["deviceType"],
    where: {
      businessId,
      eventType: ScanEventType.SCAN,
      timestamp: { gte: calendarDaysAgo(days) },
    },
    _count: { _all: true },
  });

  const order: DeviceType[] = [
    DeviceType.IPHONE,
    DeviceType.ANDROID,
    DeviceType.DESKTOP,
    DeviceType.UNKNOWN,
  ];

  return order
    .map((device) => ({
      key: device,
      label: DEVICE_LABELS[device],
      count: rows.find((row) => row.deviceType === device)?._count._all ?? 0,
    }))
    .filter((row) => row.count > 0);
}

/** Cifras globales del panel administrativo. */
export async function getAdminOverview() {
  // Se agrupan las cifras en lugar de disparar un `count` por cada una: el
  // dashboard abría más de una decena de conexiones simultáneas y agotaba el
  // pool en despliegues con un límite bajo.
  const [businesses, tags, events, pendingRequests, activeServices, newLeads] =
    await Promise.all([
      prisma.business.count(),
      prisma.tag.groupBy({ by: ["active"], _count: { _all: true } }),
      prisma.scanEvent.groupBy({ by: ["eventType"], _count: { _all: true } }),
      prisma.serviceRequest.count({
        where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING_CLIENT"] } },
      }),
      prisma.businessService.count({ where: { status: "ACTIVE" } }),
      prisma.contactLead.count({ where: { status: "NEW" } }),
    ]);

  const tagsActive = tags.find((row) => row.active)?._count._all ?? 0;
  const tagsInactive = tags.find((row) => !row.active)?._count._all ?? 0;

  const countFor = (type: ScanEventType) =>
    events.find((row) => row.eventType === type)?._count._all ?? 0;

  return {
    businesses,
    tagsTotal: tagsActive + tagsInactive,
    tagsActive,
    tagsInactive,
    scansTotal: countFor(ScanEventType.SCAN),
    clicksTotal: countFor(ScanEventType.CLICK),
    pendingRequests,
    activeServices,
    newLeads,
  };
}

/** Negocios con más scans en el día en curso. */
export async function getTodayActivity(limit = 5) {
  const rows = await prisma.scanEvent.groupBy({
    by: ["businessId"],
    where: { eventType: ScanEventType.SCAN, timestamp: { gte: calendarDaysAgo(1) } },
    _count: { _all: true },
    orderBy: { _count: { businessId: "desc" } },
    take: limit,
  });

  if (rows.length === 0) return [];

  const businesses = await prisma.business.findMany({
    where: { id: { in: rows.map((row) => row.businessId) } },
    select: { id: true, name: true },
  });

  const names = new Map(businesses.map((b) => [b.id, b.name]));

  return rows.map((row) => ({
    businessId: row.businessId,
    name: names.get(row.businessId) ?? "Negocio eliminado",
    scans: row._count._all,
  }));
}

// ---------------------------------------------------------------------------

export const TARGET_LABELS: Record<string, string> = {
  MENU: "Menú",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
  GOOGLE_REVIEWS: "Google Reviews",
  GOOGLE_MAPS: "Google Maps",
  WEBSITE: "Sitio web",
  PHONE: "Llamadas",
  CATALOG: "Catálogo",
  CUSTOM: "Otros enlaces",
  // Destino sintético del botón del menú nativo: no es un BusinessLink, así que
  // no puede reutilizar el valor MENU sin confundirse con el enlace externo.
  MENU_NATIVE: "Menú digital",
};

export const DEVICE_LABELS: Record<DeviceType, string> = {
  IPHONE: "iPhone",
  ANDROID: "Android",
  DESKTOP: "Escritorio",
  UNKNOWN: "Desconocido",
};

/**
 * Inicio de la ventana de `days` días naturales que termina hoy, medido en la
 * zona horaria del negocio.
 *
 * Todas las cifras de un mismo período pasan por aquí, de modo que el total de
 * la gráfica y el de las tarjetas de resumen coincidan siempre. Con `days = 1`
 * devuelve el inicio del día de hoy.
 */
function calendarDaysAgo(days: number): Date {
  return startOfLastZonedDays(TIMEZONE, days);
}
