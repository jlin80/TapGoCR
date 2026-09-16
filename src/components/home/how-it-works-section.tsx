import { SectionHeading, Step } from "@/components/marketing";

/**
 * "Vos no configurás nada": el mensaje comercial más importante de la
 * página, según su propio peso en el funnel — por eso son 6 pasos concretos
 * y no una promesa vaga. Mismo componente `Step` que ya usaba la versión de
 * 3 pasos; el contenido cambió, no el slot que ocupa en la página.
 */
export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Vos no configurás nada."
          description="Vos elegís qué querés. Nosotros hacemos el resto."
        />

        <ol className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          <Step number={1} title="Elegís">
            Decidís qué querés que haga tu TapGo: menú, WhatsApp, reseñas, redes o
            varias cosas a la vez.
          </Step>
          <Step number={2} title="Nos pasás tu información" delay={2}>
            Logo, enlaces, menú, WhatsApp, redes — lo que ya tengas.
          </Step>
          <Step number={3} title="Diseñamos" delay={3}>
            Creamos una experiencia alineada con tu marca.
          </Step>
          <Step number={4} title="Configuramos" delay={4}>
            Programamos el NFC, el QR y tu experiencia digital.
          </Step>
          <Step number={5} title="Recibís" delay={4}>
            Tu TapGo listo para usar, sin nada más que hacer de tu lado.
          </Step>
          <Step number={6} title="TAP → GO" delay={4}>
            Tu cliente acerca el teléfono o escanea, y la acción ocurre al instante.
          </Step>
        </ol>
      </div>
    </section>
  );
}
