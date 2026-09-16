import { Check, SectionHeading } from "@/components/marketing";

const SCATTERED = ["Menú", "Instagram", "WhatsApp", "Google", "Ubicación"];

const AFTER = [
  "El mismo código de siempre, contenido que actualizás vos",
  "Un solo código con todo: menú, WhatsApp, redes, ubicación, reseñas",
  "Analytics de qué botón toca la gente y cuándo",
];

/** El problema real: la información del negocio dispersa en cinco lugares. */
export function ProblemSection() {
  return (
    <section className="on-dark border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="El problema"
          title="Tu cliente no debería tener que buscarte."
          description="Hoy tu menú, tus redes, tu WhatsApp y tu ubicación están repartidos en lugares distintos. TapGoCR los reúne en un solo lugar."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
          <div className="reveal rounded-3xl border border-border bg-surface-muted p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">
              Hoy, separado
            </h3>
            <ul className="mt-6 flex flex-col gap-4">
              {SCATTERED.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-muted">
                  <span aria-hidden="true" className="mt-0.5 text-base leading-none text-muted">
                    ✕
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal reveal-2 lift rounded-3xl border-2 border-brand bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-brand uppercase">
              Con TapGoCR
            </h3>
            <ul className="mt-6 flex flex-col gap-4">
              {AFTER.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
