import { BreakdownBars, DailyBars } from "@/components/charts";
import { StatRail } from "@/components/console";
import { Card } from "@/components/ui";
import {
  getBusinessSummary,
  getClicksByTarget,
  getDailySeries,
  getDeviceBreakdown,
  getScansByTag,
  getValueSummary,
} from "@/lib/analytics";

/**
 * Vista de analytics de un negocio.
 *
 * La comparte el panel administrativo y el del cliente: son las mismas cifras,
 * solo cambia quién puede llegar hasta aquí. Quien la renderiza ya validó el
 * acceso al negocio.
 */
export async function AnalyticsView({
  businessId,
  days = 30,
  audience = "root",
}: {
  businessId: string;
  days?: number;
  /** "client" cambia el vocabulario técnico ("tag", "placa") por "punto TapGo". */
  audience?: "client" | "root";
}) {
  const [summary, series, clicks, tags, devices, value] = await Promise.all([
    getBusinessSummary(businessId),
    getDailySeries(businessId, days),
    getClicksByTarget(businessId, days),
    getScansByTag(businessId, days),
    getDeviceBreakdown(businessId, days),
    getValueSummary(businessId, days),
  ]);

  const topTag = tags[0];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        {/*
          "Tu TapGo este mes" responde de entrada la pregunta que trae a
          cualquiera a este panel: ¿esto está funcionando? Una tabla de scans y
          clics sueltos no lo dice; una cifra con su tendencia, sí.
        */}
        <h3 className="text-sm font-medium text-muted">
          Tu TapGo en los últimos {days} días
        </h3>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight tabular-nums">
          {value.interactions.toLocaleString("es-CR")}{" "}
          <span className="text-lg font-medium text-muted">interacciones</span>
        </p>

        {value.trend !== null ? (
          <p
            className={`mt-1 text-sm font-medium ${
              value.trend >= 0 ? "text-success" : "text-warning"
            }`}
          >
            {value.trend >= 0 ? "+" : ""}
            {value.trend}% respecto al período anterior
          </p>
        ) : null}

        <p className="mt-4 text-sm text-muted">Tus clientes hicieron:</p>
        <ul className="mt-1.5 flex flex-col gap-1 text-sm">
          <li>
            <span className="font-medium tabular-nums">
              {value.scans.toLocaleString("es-CR")}
            </span>{" "}
            scans
          </li>
          {clicks.map((row) => (
            <li key={row.key}>
              <span className="font-medium tabular-nums">
                {row.count.toLocaleString("es-CR")}
              </span>{" "}
              clics en {row.label}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {value.ctr !== null ? <span>CTR: {value.ctr} clics por cada 100 scans</span> : null}
          {topTag ? (
            <span>
              {audience === "client" ? "Punto con más actividad" : "Placa más activa"}:{" "}
              <span className="font-medium text-foreground">{topTag.label}</span>{" "}
              ({topTag.count.toLocaleString("es-CR")} scans)
            </span>
          ) : null}
        </div>
      </Card>

      <StatRail
        stats={[
          { label: "Scans hoy", value: summary.scansToday },
          { label: "Scans 7 días", value: summary.scans7d },
          { label: "Scans 30 días", value: summary.scans30d },
          { label: "Clics 30 días", value: summary.clicks30d },
        ]}
      />

      <Card>
        <DailyBars data={series} label={`Scans por día (últimos ${days} días)`} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <BreakdownBars data={clicks} label="Clicks por destino" />
        </Card>
        <Card>
          <BreakdownBars
            data={tags}
            label={audience === "client" ? "Puntos con más interacciones" : "Scans por tag"}
          />
        </Card>
        <Card>
          <BreakdownBars data={devices} label="Dispositivo" />
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium">Totales históricos</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Scans</dt>
              <dd className="tabular-nums">
                {summary.scansTotal.toLocaleString("es-CR")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Clicks</dt>
              <dd className="tabular-nums">
                {summary.clicksTotal.toLocaleString("es-CR")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{audience === "client" ? "Puntos activos" : "Tags activos"}</dt>
              <dd className="tabular-nums">
                {summary.tagsActive} de {summary.tagsTotal}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
