import Link from "next/link";

import { BreakdownBars } from "@/components/charts";
import { StatRail } from "@/components/console";
import { Badge, Card, cx } from "@/components/ui";
import { getClicksByTarget } from "@/lib/analytics";
import { getFeedbackSummary, getFeedbackTrend, getRecentFeedback, periodToDays } from "@/lib/feedback";

export type FeedbackPeriod = "7d" | "30d" | "90d" | "all";
const PERIODS: Array<{ value: FeedbackPeriod; label: string }> = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "all", label: "Todo" },
];
const RATINGS = [5, 4, 3, 2, 1] as const;

/**
 * "Feedback de TapGoCR", nunca "reseñas de Google": esto es lo que se guarda
 * en el formulario interno (`/t/[code]/feedback`). No hay forma de saber si
 * un clic en "Publicar en Google" terminó en una reseña real ahí, así que esa
 * cifra se llama "Clics hacia Google", no "reseñas generadas".
 */
export async function FeedbackView({
  businessId,
  basePath,
  rating,
  period = "30d",
}: {
  businessId: string;
  /** Ruta de esta misma página, para armar los enlaces de filtro (`/client/feedback` o `/app/businesses/[id]/feedback`). */
  basePath: string;
  rating?: number;
  period?: FeedbackPeriod;
}) {
  const days = periodToDays(period);

  const [summary, trend, recent, googleClicks] = await Promise.all([
    getFeedbackSummary(businessId, days),
    getFeedbackTrend(businessId, days ?? 90),
    getRecentFeedback(businessId, { rating, days, take: 20 }),
    getClicksByTarget(businessId, days ?? 3650),
  ]);

  const googleClickCount = googleClicks.find((row) => row.key === "GOOGLE_REVIEWS")?.count ?? 0;
  const clickRate = summary.total > 0 ? Math.round((googleClickCount / summary.total) * 1000) / 10 : null;

  const trendBreakdown = trend
    .filter((point) => point.count > 0)
    .map((point) => ({ key: point.date, label: formatShortDate(point.date), count: point.count }));

  const filterLink = (params: { rating?: number; period?: FeedbackPeriod }) => {
    const search = new URLSearchParams();
    const nextRating = params.rating !== undefined ? params.rating : rating;
    const nextPeriod = params.period ?? period;
    if (nextRating) search.set("rating", String(nextRating));
    if (nextPeriod !== "30d") search.set("period", nextPeriod);
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((item) => (
          <Link
            key={item.value}
            href={filterLink({ period: item.value })}
            className={cx(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              period === item.value
                ? "border-brand bg-brand text-brand-contrast"
                : "border-border bg-surface hover:border-brand/40",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <StatRail
        stats={[
          { label: "Total de respuestas", value: summary.total },
          { label: "Promedio", value: summary.average ?? "—", hint: summary.average ? "de 5" : undefined },
          { label: "Clics hacia Google", value: googleClickCount },
          {
            label: "Tasa de clic",
            value: clickRate !== null ? `${clickRate}%` : "—",
            hint:
              clickRate !== null && clickRate > 100
                ? "Incluye clics de antes de este flujo"
                : undefined,
          },
        ]}
      />

      <Card>
        <h3 className="mb-3 text-sm font-medium">Distribución</h3>
        {summary.total === 0 ? (
          <p className="text-sm text-muted">Todavía no hay respuestas en este período.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {RATINGS.map((value) => {
              const count = summary.distribution[value];
              const percent = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
              return (
                <li key={value}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-0.5">
                      {"★".repeat(value)}
                      <span className="text-border">{"★".repeat(5 - value)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {count.toLocaleString("es-CR")} · {percent}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.max(percent, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {trendBreakdown.length > 0 ? (
        <Card>
          <BreakdownBars data={trendBreakdown} label="Respuestas por día" />
        </Card>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Respuestas recientes</h3>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={filterLink({ rating: undefined })}
              className={cx(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                !rating ? "border-brand bg-brand text-brand-contrast" : "border-border text-muted",
              )}
            >
              Todas
            </Link>
            {RATINGS.map((value) => (
              <Link
                key={value}
                href={filterLink({ rating: value })}
                className={cx(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  rating === value ? "border-brand bg-brand text-brand-contrast" : "border-border text-muted",
                )}
              >
                {"★".repeat(value)}
              </Link>
            ))}
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="surface-sunken px-6 py-8 text-center text-sm text-muted">
            Sin respuestas para este filtro.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li key={item.id}>
                <Card className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-brand" aria-hidden="true">
                      {"★".repeat(item.rating)}
                      <span className="text-border">{"★".repeat(5 - item.rating)}</span>
                    </span>
                    {item.comment ? (
                      <p className="mt-1.5 text-sm text-pretty">&ldquo;{item.comment}&rdquo;</p>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted italic">Sin comentario.</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone="neutral">{item.source === "QR" ? "QR" : "NFC"}</Badge>
                    <span className="text-xs whitespace-nowrap text-muted">{relativeTime(item.createdAt)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

/** "Hace 2 horas", "Hace 1 día" — sin librería de fechas relativas por unas pocas unidades. */
function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units: Array<[number, string]> = [
    [60, "segundo"],
    [60, "minuto"],
    [24, "hora"],
    [30, "día"],
    [12, "mes"],
  ];

  let value = seconds;
  let unit = "segundo";
  for (const [factor, name] of units) {
    if (value < factor) {
      unit = name;
      break;
    }
    value = Math.floor(value / factor);
    unit = name;
  }

  if (unit === "segundo" && value < 30) return "Recién";
  const plural: Record<string, string> = { mes: "meses" };
  const label = value === 1 ? unit : (plural[unit] ?? `${unit}s`);
  return `Hace ${value} ${label}`;
}
