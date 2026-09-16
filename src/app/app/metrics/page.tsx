import type { Metadata } from "next";

import { GroupHeading, StatRail } from "@/components/console";
import { Card } from "@/components/ui";
import { requireRoot } from "@/lib/authz";
import { getGrowthMetrics } from "@/lib/metrics";

export const metadata: Metadata = { title: "Métricas" };

/**
 * Métricas internas de negocio: cuánto factura TapGoCR y qué tan sano está
 * creciendo. Es la vista que responde "¿esto es un negocio de verdad?", no la
 * que usa un cliente para ver su propio desempeño (esa es Analytics).
 */
export default async function MetricsPage() {
  await requireRoot();
  const metrics = await getGrowthMetrics();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] font-semibold tracking-tight">
          Métricas
        </h1>
        <p className="mt-1 text-muted">
          Ingreso recurrente y salud de crecimiento, calculados solo con datos que
          la plataforma ya registra.
        </p>
      </header>

      <section className="mb-12">
        <GroupHeading
          title="Ingreso recurrente"
          description="MRR y ARR usan la mensualidad real de cada plan. Un negocio con precio a medida (override) igual cuenta con la mensualidad de su plan base, así que esta cifra nunca sobrestima el ingreso real."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <MoneyCard label="MRR" value={metrics.mrrCrc} hint="Ingreso mensual recurrente" />
          <MoneyCard label="ARR" value={metrics.arrCrc} hint="MRR × 12" />
          <MoneyCard
            label="ARPU"
            value={metrics.arpuCrc}
            hint="Ingreso mensual promedio por cliente activo"
          />
        </div>
      </section>

      <section className="mb-12">
        <GroupHeading title="Clientes" />
        <StatRail
          stats={[
            { label: "Clientes activos", value: metrics.activeClients, href: "/app/clients" },
            { label: "Clientes totales", value: metrics.totalClients, href: "/app/clients" },
            { label: "Nuevos este mes", value: metrics.newClientsThisMonth },
            {
              label: "Cortados este mes",
              value: metrics.churnedThisMonth,
              hint: "Desde que se audita el corte de servicio",
            },
            { label: "Placas activas", value: metrics.activePlacas, href: "/app/tags" },
          ]}
        />
      </section>

      <section className="mb-12">
        <GroupHeading
          title="Activación"
          description="Porcentaje de negocios que alguna vez recibieron al menos un scan."
        />
        <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight tabular-nums">
          {metrics.activationRate}%
        </p>
      </section>

      <section>
        <GroupHeading
          title="Retención"
          description="De los negocios dados de alta hace más de N días, cuántos siguen activos hoy. Es una aproximación con lo que hay disponible (alta + estado), no una medición de uso."
        />
        <StatRail
          stats={[
            {
              label: "A los 30 días",
              value: metrics.retention.d30,
              hint: "% que sigue activo",
            },
            {
              label: "A los 60 días",
              value: metrics.retention.d60,
              hint: "% que sigue activo",
            },
            {
              label: "A los 90 días",
              value: metrics.retention.d90,
              hint: "% que sigue activo",
            },
          ]}
        />
      </section>
    </>
  );
}

function MoneyCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <p className="stat-label">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight tabular-nums">
        ₡{value.toLocaleString("es-CR")}
      </p>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </Card>
  );
}
