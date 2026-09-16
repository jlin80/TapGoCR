import { Badge, StatCard } from "@/components/ui";
import { SectionHeading } from "@/components/marketing";

/**
 * Mockup del panel de analytics real (mismos componentes que usa la app:
 * `StatCard`, `Badge`), pero con datos fijos de demostración. Marcado como
 * demo en dos lugares —la insignia y el pie— a propósito: nunca se presentan
 * como resultados reales de un cliente.
 */
const SUMMARY = [
  { label: "Interacciones", value: 1284 },
  { label: "Menú", value: 734 },
  { label: "WhatsApp", value: 238 },
  { label: "Instagram", value: 184 },
  { label: "Google", value: 128 },
];

const BY_TAG = [
  { name: "Mesa 1", value: 182 },
  { name: "Mesa 2", value: 156 },
  { name: "Mesa 3", value: 129 },
  { name: "Mesa 4", value: 103 },
];

const MAX_TAG_VALUE = Math.max(...BY_TAG.map((tag) => tag.value));

export function AnalyticsSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Analytics"
          title="Sabé qué hacen tus clientes."
          description="No solo sabés cuántas personas interactuaron. Podés ver qué buscan y qué acciones generan más interés."
        />

        <div className="reveal mt-12 overflow-hidden rounded-3xl border border-border bg-surface shadow-xl sm:mt-16">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Analytics · Últimos 30 días</p>
            <Badge tone="warning">Datos de demostración</Badge>
          </div>

          <div className="grid gap-6 p-6 sm:p-8">
            <div className="stat-rail">
              {SUMMARY.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-muted">Interacciones por punto</p>
              <ul className="mt-4 flex flex-col gap-3">
                {BY_TAG.map((tag) => (
                  <li key={tag.name} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-sm text-muted">{tag.name}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-brand to-brand-400"
                        style={{ width: `${(tag.value / MAX_TAG_VALUE) * 100}%` }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right text-sm font-medium">
                      {tag.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="reveal mt-4 text-center text-xs text-muted">
          Ejemplo ilustrativo con datos de demostración — no son resultados de
          ningún negocio real.
        </p>
      </div>
    </section>
  );
}
