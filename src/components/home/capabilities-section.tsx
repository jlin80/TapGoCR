import { LinkIcon } from "@/components/link-icon";
import { SectionHeading } from "@/components/marketing";
import { LinkType } from "@/generated/prisma/enums";

/**
 * Capacidades reales del producto, una tarjeta por `LinkType` que ya existe
 * en el backend (ver `prisma/schema.prisma`). A propósito no incluye pagos,
 * WiFi ni formularios: son ejemplos de "TAP → acción" en el pedido original,
 * pero el enum `LinkType` no los soporta hoy — agregarlos acá sería vender
 * algo que el producto todavía no hace.
 */
const CAPABILITIES: Array<{ type: LinkType; title: string; benefit: string }> = [
  { type: LinkType.MENU, title: "Menú", benefit: "Tu menú siempre disponible." },
  { type: LinkType.WHATSAPP, title: "WhatsApp", benefit: "Un toque y tus clientes pueden escribirte." },
  {
    type: LinkType.GOOGLE_REVIEWS,
    title: "Reseñas",
    benefit: "Facilitá que tus clientes lleguen a Google.",
  },
  { type: LinkType.INSTAGRAM, title: "Redes sociales", benefit: "Llevá clientes directamente a tus perfiles." },
  { type: LinkType.GOOGLE_MAPS, title: "Ubicación", benefit: "Que te encuentren sin escribir la dirección." },
  { type: LinkType.CATALOG, title: "Catálogo", benefit: "Mostrá todo lo que vendés, siempre actualizado." },
  { type: LinkType.WEBSITE, title: "Sitio web", benefit: "Un toque directo a tu página." },
  { type: LinkType.CUSTOM, title: "Lo que necesites", benefit: "Cualquier enlace que tu negocio use hoy." },
];

export function CapabilitiesSection() {
  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Qué puede hacer TapGo"
          title="Un toque puede hacer mucho."
          description="Conectá a tus clientes directamente con la acción que querés."
        />

        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item) => (
            <li
              key={item.type}
              className="reveal lift flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <LinkIcon type={item.type} className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.benefit}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
