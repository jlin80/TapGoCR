import { LinkButton } from "@/components/ui";

/** Último empujón antes del formulario de contacto. */
export function FinalCtaSection() {
  return (
    <section className="on-dark border-b border-border">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24">
        <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
          ¿Listo para llevar tu negocio a un toque?
        </h2>
        <p className="reveal mx-auto mt-4 max-w-xl text-base text-muted text-pretty sm:text-lg">
          Diseñamos, configuramos y dejamos tu TapGo listo para usar.
        </p>

        <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="#contacto" variant="primary" className="px-7 py-3.5 text-base">
            Quiero mi TapGo
          </LinkButton>
          <LinkButton href="/precios" variant="secondary" className="px-7 py-3.5 text-base">
            Ver planes
          </LinkButton>
        </div>

        <p className="reveal mt-6 text-sm text-muted">Menú · WhatsApp · Reviews · Redes y más</p>
      </div>
    </section>
  );
}
