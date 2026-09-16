import type { Breakdown, DailyPoint } from "@/lib/analytics";

/**
 * Gráficas mínimas dibujadas con CSS y SVG.
 *
 * El MVP pide "gráficas simples"; una librería de charting añadiría cientos de
 * kilobytes al bundle para dibujar barras. Si más adelante hacen falta gráficas
 * interactivas, se sustituye este archivo.
 */

// Índice 0 = domingo. Se usa X para miércoles, como es habitual en calendarios
// en español, para no repetir la M de martes.
const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];

export function DailyBars({
  data,
  label = "Scans por día",
}: {
  data: DailyPoint[];
  label?: string;
}) {
  const max = Math.max(1, ...data.map((point) => point.scans));
  const showEveryLabel = data.length <= 10;

  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">{label}</figcaption>
      {/*
        Sin `items-end`: esa alineacion impide que cada columna se estire a la
        altura del contenedor, y entonces el `height: X%` de la barra se resuelve
        contra una altura indefinida y da cero. El grafico salia vacio. Las
        columnas ocupan todo el alto y `justify-end` empuja la barra abajo, que
        es lo que `items-end` intentaba conseguir.
      */}
      <div className="flex h-40 gap-1" role="img" aria-label={label}>
        {data.map((point) => {
          const height = Math.round((point.scans / max) * 100);
          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col justify-end"
              title={`${formatDate(point.date)}: ${point.scans} scans, ${point.clicks} clicks`}
            >
              <div
                className="rounded-t bg-brand transition-colors group-hover:bg-brand-strong"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-muted">
        {data.map((point, index) => (
          <span key={point.date} className="flex-1 text-center">
            {showEveryLabel || index % 5 === 0 ? weekdayOf(point.date) : ""}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Total del período: {sum(data, "scans").toLocaleString("es-CR")} scans ·{" "}
        {sum(data, "clicks").toLocaleString("es-CR")} clicks
      </p>
    </figure>
  );
}

export function BreakdownBars({
  data,
  label,
  emptyMessage = "Sin datos en el período.",
}: {
  data: Breakdown[];
  label: string;
  emptyMessage?: string;
}) {
  const total = data.reduce((acc, row) => acc + row.count, 0);
  const max = Math.max(1, ...data.map((row) => row.count));

  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">{label}</figcaption>
      {data.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {row.count.toLocaleString("es-CR")}
                  {total > 0 ? ` · ${Math.round((row.count / total) * 100)}%` : ""}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max((row.count / max) * 100, 2)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

function sum(data: DailyPoint[], key: "scans" | "clicks"): number {
  return data.reduce((acc, point) => acc + point[key], 0);
}

function weekdayOf(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return WEEKDAYS[date.getDay()] ?? "";
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}
