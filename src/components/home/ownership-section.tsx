import { Check, SectionHeading } from "@/components/marketing";

/**
 * El concepto comercial central: el precio tiene dos partes bien distintas
 * (producto físico, pago único / plataforma digital, mensualidad), y hay que
 * dejarlo clarísimo antes de que la persona vea una cifra. Va justo después
 * del hero porque es lo primero que hay que entender antes de ver precios o
 * funciones.
 */
const PHYSICAL = ["Placa personalizada", "Chip NFC", "Código QR", "Diseño", "Configuración inicial"];

const DIGITAL = ["Página digital", "Analytics", "Dashboard", "Actualizaciones", "Hosting", "Soporte"];

export function OwnershipSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Qué estás comprando"
          title="Comprás tu placa. Es tuya."
          description="El pago inicial cubre tu placa. La mensualidad mantiene tu plataforma funcionando."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
          <div className="reveal rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">
              Tu producto físico
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
              Tu plataforma digital
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Mensualidad</p>
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
