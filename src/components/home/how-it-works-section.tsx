import { SectionHeading } from "@/components/marketing";

/**
 * Reemplaza tres secciones que decían variaciones de lo mismo (TAP→GO, "vos
 * no configurás nada" en 6 pasos, el selector de objetivos): un solo gráfico
 * horizontal de 3 pasos. El mensaje comercial ("nosotros configuramos todo")
 * queda como una frase corta en el paso 2, no como una lista de 6 tarjetas.
 */
const STEPS = [
  {
    number: "01",
    title: "Tocás o escaneás",
    body: "NFC o QR, en la misma placa.",
  },
  {
    number: "02",
    title: "Se abre tu página",
    body: "Sin descargar nada. Nosotros la configuramos por vos.",
  },
  {
    number: "03",
    title: "Elegís qué hacer",
    body: "Menú, WhatsApp, redes, reseñas o cómo llegar.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading eyebrow="Cómo funciona" title="Tocá. Se abre. Elegís." />

        <ol className="reveal mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.number} className="relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
              <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-brand/30">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>

              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -right-2 hidden -translate-y-1/2 text-2xl text-brand/40 sm:block"
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="reveal mt-8 text-center text-sm text-muted">
          ¿Su teléfono no tiene NFC? Escaneá el QR — la misma placa lleva a la misma página.
        </p>
      </div>
    </section>
  );
}
