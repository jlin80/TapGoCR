import { SectionHeading, Step } from "@/components/marketing";

/**
 * Proceso real de pedido, sin tiempos ni métodos de envío inventados —
 * eso todavía no está definido, así que no aparece acá.
 */
const STEPS = [
  { title: "Elegís tu paquete", body: "Starter, Business o Pro, según cuántas placas necesitás." },
  { title: "Nos compartís tu información", body: "Logo, WhatsApp, redes, menú y lo que quieras que abra tu placa." },
  { title: "Configuramos tu experiencia digital", body: "Armamos tu página con tus enlaces, lista para conectar." },
  { title: "Preparamos tu placa", body: "Con tu diseño, tu chip NFC y tu código QR." },
  { title: "Recibís tu TapGo listo para usar", body: "Solo la instalás y ya está funcionando." },
] as const;

export function DeliverySection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading eyebrow="El proceso" title="Así recibís tu TapGo" />

        <ol className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <Step
              key={step.title}
              number={index + 1}
              title={step.title}
              delay={index >= 1 && index <= 3 ? ((index + 1) as 2 | 3 | 4) : undefined}
            >
              {step.body}
            </Step>
          ))}
        </ol>
      </div>
    </section>
  );
}
