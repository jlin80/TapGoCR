import { SectionHeading } from "@/components/marketing";

const SERVICES = [
  {
    title: "Dominio",
    body: "Te ayudamos a elegirlo, hacemos el trámite y configuramos el DNS.",
  },
  {
    title: "Sitio web",
    body: "Desarrollado por nosotros, con el contenido y las secciones que pidas.",
  },
  {
    title: "Hosting",
    body: "Lo dejamos funcionando y nos encargamos de que siga en línea.",
  },
  {
    title: "Mantenimiento",
    body: "Actualizaciones y cambios cuando tu negocio los necesite.",
  },
];

/** Servicios adicionales, más allá de las placas. */
export function ServicesSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Servicios"
          title="Y si necesitás más que las placas"
          description="El sitio web lo desarrollamos nosotros, a mano y a medida. No es un armador de páginas: es trabajo hecho para tu negocio."
        />

        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, index) => (
            <div
              key={service.title}
              className={`reveal lift rounded-2xl border border-border bg-surface p-7 ${
                index > 0 ? `reveal-${Math.min(index + 1, 4)}` : ""
              }`}
            >
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="mt-2.5 text-sm text-muted">{service.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
