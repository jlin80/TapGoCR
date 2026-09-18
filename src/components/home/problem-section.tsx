import { SectionHeading } from "@/components/marketing";

/**
 * Vende el problema, no la placa otra vez — el hero ya mostró el producto.
 * Esta sección responde "¿por qué lo necesito?" antes de explicar cómo
 * funciona. Los puntos de contacto listados son enlaces reales que TapGoCR
 * ya soporta (ver `LinkType` en el schema), nada inventado.
 */
const SCATTERED = ["WhatsApp", "Instagram", "Menú", "Google Maps", "Sitio web", "Reseñas"];

export function ProblemSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="El problema"
          title="Tu negocio está repartido en demasiados lugares."
          description="Tu cliente tiene que buscar tu WhatsApp, encontrar tu Instagram, pedir la dirección y esperar el menú por separado. Cada paso de más es una persona que se cansa antes de llegar."
        />

        <div className="reveal mt-10 flex flex-wrap justify-center gap-2">
          {SCATTERED.map((item) => (
            <span
              key={item}
              className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted"
            >
              {item}
            </span>
          ))}
        </div>

        <p className="reveal mt-8 text-base font-medium text-pretty sm:text-lg">
          TapGoCR concentra todo eso en un solo lugar: tu placa.
        </p>
      </div>
    </section>
  );
}
