import { Badge, type BadgeTone } from "@/components/ui";
import type { PlacaQuota, QuotaLevel } from "@/lib/chips";

/** Etiqueta y color de cada estado de cuota de placas. */
const LEVEL_LABELS: Record<QuotaLevel, string> = {
  OK: "Al día",
  WARNING: "Cerca del tope",
  EXCEEDED: "Tope de placas alcanzado",
};

const LEVEL_TONES: Record<QuotaLevel, BadgeTone> = {
  OK: "success",
  WARNING: "warning",
  EXCEEDED: "danger",
};

const BAR_COLORS: Record<QuotaLevel, string> = {
  OK: "bg-success",
  WARNING: "bg-warning",
  EXCEEDED: "bg-danger",
};

export function QuotaBadge({ quota }: { quota: PlacaQuota }) {
  return <Badge tone={LEVEL_TONES[quota.level]}>{LEVEL_LABELS[quota.level]}</Badge>;
}

/** Barra de placas activas contra las incluidas en el plan. */
export function QuotaBar({ quota }: { quota: PlacaQuota }) {
  if (quota.limit === null) {
    return (
      <div>
        <span className="tabular-nums text-sm">
          {quota.activeTags.toLocaleString("es-CR")}{" "}
          <span className="text-muted">placas activas · sin tope fijo</span>
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="tabular-nums">
          {quota.activeTags.toLocaleString("es-CR")}{" "}
          <span className="text-muted">de {quota.limit.toLocaleString("es-CR")} placas</span>
        </span>
        <span className="tabular-nums text-muted">{quota.percent}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${BAR_COLORS[quota.level]}`}
          style={{ width: `${Math.min(quota.percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Aviso que ve el cliente cuando se acerca a las placas incluidas en su plan
 * o las agota. Nunca corta el servicio ni bloquea nada: solo invita a agregar
 * placas o subir de plan. Los taps siguen siendo siempre ilimitados.
 */
export function QuotaNotice({ quota }: { quota: PlacaQuota }) {
  if (quota.level === "OK") return null;

  const critical = quota.level === "EXCEEDED";

  return (
    <div
      role="status"
      className={
        critical
          ? "mb-6 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"
          : "mb-6 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning"
      }
    >
      <p className="font-medium">
        {critical
          ? "Ya usás todas las placas incluidas en tu plan."
          : "Estás cerca de las placas incluidas en tu plan."}
      </p>
      <p className="mt-1">
        Tus taps siguen siendo ilimitados. Escribinos si querés agregar placas o subir de
        plan.
      </p>
    </div>
  );
}
