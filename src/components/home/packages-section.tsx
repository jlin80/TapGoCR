import { PackageCard, SectionHeading } from "@/components/marketing";
import { PACKAGES } from "@/lib/packages";

/**
 * Servicios adicionales, no una segunda escalera de precios.
 *
 * `PACKAGES` tiene 5 niveles (`src/lib/packages.ts`), pero los dos primeros
 * (NFC+QR, NFC+QR+Analytics) ya están cubiertos por Starter/Business/Pro —
 * mostrarlos acá otra vez era la "doble oferta" que confundía: dos escaleras
 * de precio compitiendo en la misma página. Solo se muestran los niveles que
 * de verdad son un servicio aparte (dominio propio, sitio web, todo
 * administrado), como upsell después de que ya se entendió el plan.
 *
 * Ningún slug ni ruta se tocó: `/paquetes/{slug}` sigue existiendo para los
 * 5 niveles — esto es solo qué se destaca en la home. `id="paquetes"` se
 * mantiene porque `/precios` y otras páginas ya enlazan a `/#paquetes`.
 */
const ADDITIONAL_SERVICES = PACKAGES.filter((item) => item.level >= 3);

export function PackagesSection() {
  return (
    <section id="paquetes" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="¿Necesitás algo más?"
          title="Servicios adicionales"
          description="Además de tu plan, podés sumar esto cuando tu negocio lo necesite."
        />

        <ul className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {ADDITIONAL_SERVICES.map((item) => (
            <PackageCard key={item.slug} {...item} />
          ))}
        </ul>

        <p className="reveal mt-10 text-center text-muted">
          ¿Necesitás algo puntual que no está acá?{" "}
          <a href="#contacto" className="font-medium text-brand hover:underline">
            Contanos
          </a>{" "}
          y armamos una propuesta a medida.
        </p>
      </div>
    </section>
  );
}
