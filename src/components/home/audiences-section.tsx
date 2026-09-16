import Link from "next/link";

import { Marquee, SectionHeading } from "@/components/marketing";
import { INDUSTRIES } from "@/lib/industries";

// Antes eran dos listas para poner una cinta arriba y otra abajo, moviéndose en
// sentidos opuestos. Se unen en una sola: en reposo —sin animación, por
// `prefers-reduced-motion` o por un navegador sin desplazamiento nativo— dos
// bloques de "pills" independientes con un hueco entre ambos se leían como dos
// hileras de botones sueltas, no como una sola cinta.
//
// Cubre más rubros de los que tienen página propia (`INDUSTRIES`, más abajo):
// es la lista amplia de "para quién sirve", no solo los seis con guía dedicada.
const AUDIENCES = [
  "Restaurantes",
  "Cafeterías",
  "Bares",
  "Sodas",
  "Barberías y salones",
  "Hoteles y hospedajes",
  "Tiendas",
  "Gimnasios",
  "Clínicas dentales",
  "Ferias y emprendimientos",
];

/**
 * Para quién es TapGoCR: la cinta amplia de rubros, y debajo una tarjeta por
 * cada uno de los que sí tiene guía propia (`src/lib/industries.ts`), con su
 * beneficio real y distinto — no la misma lista repetida seis veces.
 */
export function AudiencesSection() {
  return (
    <section id="industrias" className="border-b border-border bg-surface-muted py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <SectionHeading
          eyebrow="Casos de uso"
          title="Un TapGo para cada negocio."
        />
      </div>
      <div className="mt-12 sm:mt-16">
        <Marquee items={AUDIENCES} plain />
      </div>

      <div className="mx-auto mt-12 max-w-5xl px-5 sm:mt-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={`/${industry.slug}`}
                className="lift block h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand"
              >
                <p className="font-semibold">{industry.name}</p>
                <p className="mt-1.5 text-sm text-muted">{industry.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
