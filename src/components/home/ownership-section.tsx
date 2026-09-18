import { Check, SectionHeading } from "@/components/marketing";

/**
 * "Placa vs plataforma": separa con claridad qué corresponde al pago único
 * y qué a la mensualidad. Va justo después de precios — ahí es cuando la
 * persona necesita esta distinción, no antes de ver una cifra.
 */
const PHYSICAL = ["Placa física", "NFC", "QR", "Personalización", "Configuración"];

const DIGITAL = ["Página digital", "Administración", "Actualizaciones", "Analytics"];

export function OwnershipSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="Placa vs plataforma"
          title="Tu placa es tuya. La plataforma mantiene tu experiencia actualizada."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
          <div className="reveal rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">
              Tu placa
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Pago inicial</p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {PHYSICAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal reveal-2 lift rounded-3xl border-2 border-brand bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-brand uppercase">
              Tu plataforma
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Pago mensual</p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {DIGITAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="reveal mx-auto mt-10 max-w-2xl text-center text-muted">
          La placa lleva a tus clientes hasta tu negocio digital. La plataforma se encarga
          de todo lo que sucede después.
        </p>
      </div>
    </section>
  );
}
