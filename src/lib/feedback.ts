import { prisma } from "@/lib/prisma";
import { TIMEZONE } from "@/lib/analytics";
import { lastZonedDays, startOfLastZonedDays, zonedDateKey } from "@/lib/timezone";

/**
 * Consultas del feedback interno (rating + comentario).
 *
 * Mismo criterio que `src/lib/analytics.ts`: ninguna función acá comprueba
 * permisos, se asume que `businessId` ya pasó por `src/lib/authz.ts`. Esto es
 * "Feedback de TapGoCR", no "reseñas de Google" — TapGoCR nunca sabe si un
 * clic en "Publicar en Google" terminó en una reseña real ahí.
 */

export type FeedbackSummary = {
  total: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export async function getFeedbackSummary(
  businessId: string,
  days?: number,
): Promise<FeedbackSummary> {
  const rows = await prisma.feedback.groupBy({
    by: ["rating"],
    where: { businessId, ...(days ? { createdAt: { gte: startOfLastZonedDays(TIMEZONE, days) } } : {}) },
    _count: { _all: true },
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  let total = 0;
  let ratingSum = 0;

  for (const row of rows) {
    const rating = row.rating as 1 | 2 | 3 | 4 | 5;
    if (rating in distribution) {
      distribution[rating] = row._count._all;
      total += row._count._all;
      ratingSum += rating * row._count._all;
    }
  }

  return {
    total,
    average: total > 0 ? Math.round((ratingSum / total) * 100) / 100 : null,
    distribution,
  };
}

export type FeedbackTrendPoint = { date: string; count: number; average: number | null };

/** Promedio y volumen por día, mismo recorte de zona horaria que `getDailySeries`. */
export async function getFeedbackTrend(
  businessId: string,
  days: number,
): Promise<FeedbackTrendPoint[]> {
  const rows = await prisma.feedback.findMany({
    where: { businessId, createdAt: { gte: startOfLastZonedDays(TIMEZONE, days) } },
    select: { createdAt: true, rating: true },
  });

  const byDay = new Map<string, { count: number; sum: number }>();
  for (const row of rows) {
    const key = zonedDateKey(TIMEZONE, row.createdAt);
    const entry = byDay.get(key) ?? { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += row.rating;
    byDay.set(key, entry);
  }

  return lastZonedDays(TIMEZONE, days).map((date) => {
    const entry = byDay.get(date);
    return {
      date,
      count: entry?.count ?? 0,
      average: entry && entry.count > 0 ? Math.round((entry.sum / entry.count) * 100) / 100 : null,
    };
  });
}

export type RecentFeedback = {
  id: string;
  rating: number;
  comment: string | null;
  source: "TAP" | "QR";
  createdAt: Date;
};

export async function getRecentFeedback(
  businessId: string,
  options: { rating?: number; days?: number; take?: number } = {},
): Promise<RecentFeedback[]> {
  return prisma.feedback.findMany({
    where: {
      businessId,
      ...(options.rating ? { rating: options.rating } : {}),
      ...(options.days ? { createdAt: { gte: startOfLastZonedDays(TIMEZONE, options.days) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options.take ?? 20,
    select: { id: true, rating: true, comment: true, source: true, createdAt: true },
  });
}

/** Días atrás según el período de filtro que ofrece el panel. */
export function periodToDays(period: "7d" | "30d" | "90d" | "all"): number | undefined {
  if (period === "7d") return 7;
  if (period === "30d") return 30;
  if (period === "90d") return 90;
  return undefined;
}
