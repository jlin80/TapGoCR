import { Check, SectionHeading } from "@/components/marketing";

/**
 * Responde de frente a la objeción más común antes de comprar: "¿por qué no
 * uso un sticker NFC barato en vez de esto?". No se ataca al sticker barato —
 * se reconoce que el chip en sí es lo mismo — y se muestra, punto por punto,
 * qué hay alrededor de ese chip en cada caso.
 */
const STICKER = [
  "Solo abre un enlace",
  "Lo configurás vos",
  "Sin analytics",
  "Sin panel de administración",
  "Un enlace",
  "Diseño genérico",
  "Sin soporte",
  "Vos resolvés la configuración",
];

const TAPGOCR = [
  "Página personalizada de tu negocio",
  "NFC + QR",
  "Configuración incluida",
  "Analytics",
  "Panel de administración",
  "Menú + WhatsApp + redes + reseñas + ubicación",
  "Placas personalizadas",
  "Soporte local",
];

export function DifferentiationSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Por qué TapGoCR"
          title="NFC barato hay en todas partes. TapGoCR es lo que hacés con él."
        />

        <div className="reveal mx-auto mt-8 max-w-2xl text-center text-base text-muted text-pretty sm:text-lg">
          <p>
            Podés comprar un sticker NFC barato y programarlo vos mismo. El
            problema es que el sticker no es el producto completo.
          </p>
          <p className="mt-3">
            TapGoCR convierte ese NFC en una herramienta digital para tu
            negocio.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-2">
          <div className="reveal rounded-3xl border border-border bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-muted uppercase">
              Sticker NFC
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5">
              {STICKER.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-muted">
                  <span aria-hidden="true" className="mt-0.5 text-base leading-none">
                    ✕
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal reveal-2 lift rounded-3xl border-2 border-brand bg-surface p-7 sm:p-10">
            <h3 className="text-sm font-semibold tracking-widest text-brand uppercase">
              TapGoCR
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5">
              {TAPGOCR.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="reveal mt-10 text-center text-base text-muted">
          El NFC es barato. Lo que tiene valor es todo lo que construís
          alrededor de él.
        </p>
      </div>
    </section>
  );
}
