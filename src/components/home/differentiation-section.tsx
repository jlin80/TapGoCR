import { SectionHeading } from "@/components/marketing";

/**
 * Responde a la objeción "¿por qué no imprimo un QR suelto?" sin tabla
 * extensa: el punto es que TapGoCR es un producto terminado (placa + NFC +
 * QR + página + plataforma), no un componente electrónico suelto.
 */
const STACK = ["Placa física", "NFC", "QR", "Experiencia digital", "Plataforma"];

export function DifferentiationSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="Por qué TapGoCR"
          title="Más que un QR."
          description="Una puerta digital para tu negocio."
        />

        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3">
          {STACK.map((item, index) => (
            <span key={item} className="flex items-center gap-3">
              <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
                {item}
              </span>
              {index < STACK.length - 1 ? (
                <span aria-hidden="true" className="text-brand/50">
                  +
                </span>
              ) : null}
            </span>
          ))}
        </div>

        <p className="reveal mt-8 text-base text-muted text-pretty sm:text-lg">
          Un QR impreso suelto abre un solo enlace. Tu placa abre tu negocio entero, y nosotros
          armamos y mantenemos todo lo que hay detrás.
        </p>
      </div>
    </section>
  );
}
