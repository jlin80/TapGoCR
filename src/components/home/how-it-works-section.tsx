import { SectionHeading, Step } from "@/components/marketing";

/** Los tres pasos, de instalar la placa a medir y actualizar. */
export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Tres pasos. Nada técnico de tu lado."
          description="Nos encargamos de todo lo técnico. Vos solo decidís qué querés mostrar."
        />

        <ol className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-3">
          <Step number={1} title="Instalás">
            Colocamos tu placa TapGo en mesas, mostradores, entradas u otros
            puntos de contacto.
          </Step>
          <Step number={2} title="Tu cliente toca o escanea" delay={2}>
            Con NFC o QR accede inmediatamente a la página digital de tu
            negocio.
          </Step>
          <Step number={3} title="Vos medís y actualizás" delay={3}>
            Cambiá tu menú, enlaces y contenido desde tu panel y consultá las
            interacciones.
          </Step>
        </ol>
      </div>
    </section>
  );
}
