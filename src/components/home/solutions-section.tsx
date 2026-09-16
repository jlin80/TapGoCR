import { LinkIcon } from "@/components/link-icon";
import { SectionHeading } from "@/components/marketing";
import { LinkType } from "@/generated/prisma/enums";

/**
 * El mismo producto, organizado por objetivo en vez de por "placa NFC". Cada
 * "solución" es un subconjunto de `LinkType` real, no un producto nuevo —
 * evita vender algo que después el panel no puede configurar.
 */
const SOLUTIONS = [
  {
    name: "TapGo Menú",
    tagline: "Tu menú digital a un toque.",
    type: LinkType.MENU,
  },
  {
    name: "TapGo Reviews",
    tagline: "Facilitá que tus clientes te dejen una reseña.",
    type: LinkType.GOOGLE_REVIEWS,
  },
  {
    name: "TapGo WhatsApp",
    tagline: "Un toque y hablan con tu negocio.",
    type: LinkType.WHATSAPP,
  },
  {
    name: "TapGo Social",
    tagline: "Conectá tus redes con tus clientes.",
    type: LinkType.INSTAGRAM,
  },
  {
    name: "TapGo Business",
    tagline: "Varias acciones en una sola experiencia.",
    type: LinkType.CUSTOM,
  },
] as const;

export function SolutionsSection() {
  return (
    <section id="soluciones" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Soluciones"
          title="Elegí para qué querés tu TapGo."
          description="No vendemos una placa. Vendemos el resultado que necesita tu negocio."
        />

        <ul className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-5">
          {SOLUTIONS.map((solution) => (
            <li
              key={solution.name}
              className="reveal lift flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <LinkIcon type={solution.type} className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{solution.name}</h3>
                <p className="mt-1 text-sm text-muted">{solution.tagline}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
