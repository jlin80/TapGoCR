import { Check, SectionHeading } from "@/components/marketing";

/**
 * El concepto comercial central del sitio: la placa se compra una vez y es
 * del negocio; TapGo Smart es la suscripción opcional que la vuelve
 * inteligente. Va justo después del hero porque es lo primero que hay que
 * entender antes de ver precios o funciones.
 */
const OWNERSHIP = [
  "Pagás la placa una sola vez",
  "Es tuya, sin mensualidad obligatoria",
  "Funciona con NFC y QR desde el primer día",
];

const SMART = [
  "Cambiá a qué apunta tu placa sin reimprimir nada",
  "Analytics de escaneos y taps",
  "Hosting, mantenimiento y soporte incluidos",
];

export function OwnershipSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Cómo funciona la propuesta"
          title="Tu placa es tuya. TapGo la hace inteligente."
          description="Comprá una vez. Usá siempre. Activá Smart cuando quieras."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
          <div className="reveal rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">
              Tu placa
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Pago único</p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {OWNERSHIP.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal reveal-2 lift rounded-3xl border-2 border-brand bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-brand uppercase">
              TapGo Smart
            </h3>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Suscripción opcional</p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {SMART.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="reveal mx-auto mt-10 max-w-2xl text-center text-muted">
          Ejemplo: tu placa dice <strong className="font-semibold text-foreground">&ldquo;Menú&rdquo;</strong>.
          Cuando cambiés el menú, no cambiás la placa — entrás a tu panel de
          TapGo Smart y cambiás el destino. Eso es lo que pagás con la
          mensualidad: no la placa, la inteligencia detrás de ella.
        </p>
      </div>
    </section>
  );
}
