import { SectionHeading } from "@/components/marketing";

/**
 * Formatos de hardware que realmente existen hoy (ver `src/lib/packages.ts`):
 * placas y stickers con NFC + QR. Nada inventado, nada de "próximamente".
 */
const FORMATS = [
  {
    title: "Placas",
    body: "Para mesas, mostradores y entradas. Personalizadas con el diseño de tu negocio.",
  },
  {
    title: "Stickers",
    body: "Formato liviano para vitrinas, cajas o cualquier superficie chica.",
  },
];

const TRAITS = ["Personalizado", "NFC + QR", "Pensado para espacios físicos", "Fácil de usar"];

export function HardwareSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Hardware"
          title="Hardware diseñado para tu negocio."
          description="El chip NFC y el QR son la tecnología de entrada. El formato lo elegís según dónde va cada punto de contacto."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2">
          {FORMATS.map((format) => (
            <div key={format.title} className="reveal lift rounded-2xl border border-border bg-surface p-7">
              <h3 className="text-lg font-semibold">{format.title}</h3>
              <p className="mt-2.5 text-sm text-muted">{format.body}</p>
            </div>
          ))}
        </div>

        <ul className="reveal mt-10 flex flex-wrap justify-center gap-3">
          {TRAITS.map((trait) => (
            <li
              key={trait}
              className="rounded-full border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-muted"
            >
              {trait}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
