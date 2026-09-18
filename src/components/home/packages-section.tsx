import Link from "next/link";

import { SectionHeading } from "@/components/marketing";
import { LinkButton } from "@/components/ui";
import { PACKAGES } from "@/lib/packages";

/**
 * Combina dos cosas que antes eran dos secciones separadas: cotización para
 * pedidos múltiples y los servicios adicionales (dominio propio, sitio web,
 * todo administrado — niveles 3-5 de `packages.ts`). Ambas son casos que no
 * encajan en el plan estándar de `/precios`, así que viven juntas en un solo
 * bloque compacto en vez de competir por atención con los planes principales.
 */
const ADDITIONAL_SERVICES = PACKAGES.filter((item) => item.level >= 3);
const QUANTITIES = ["5", "10", "15", "20+"];

export function PackagesSection() {
  return (
    <section id="paquetes" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading eyebrow="¿Necesitás algo más?" title="Pedidos grandes y servicios adicionales" />

        <div className="reveal mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center sm:mt-12 sm:p-8">
          <p className="font-medium">¿Necesitás varias placas para tu negocio?</p>
          <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold text-brand sm:text-3xl">
            {QUANTITIES.map((qty, index) => (
              <span key={qty} className="flex items-center gap-2">
                {qty}
                {index < QUANTITIES.length - 1 ? (
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <p className="max-w-md text-sm text-muted">
            Cotizamos pedidos múltiples según cantidad y necesidades de tu negocio.
          </p>
          <LinkButton href="#contacto" variant="primary">
            Solicitar cotización
          </LinkButton>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {ADDITIONAL_SERVICES.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/paquetes/${item.slug}`}
                className="lift block h-full rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand"
              >
                <p className="font-semibold">{item.name}</p>
                <span className="mt-2 inline-block text-sm text-brand">
                  Ver detalle <span aria-hidden="true">&rsaquo;</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
