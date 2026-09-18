import { SectionHeading } from "@/components/marketing";

/**
 * Beneficios reales de la placa + plataforma, sin repetir la foto del
 * producto (ya está en el hero) ni el hub de destinos (ya lo demuestra
 * `TryItSection` de forma interactiva). Cinco puntos, cada uno una función
 * que el sistema realmente tiene hoy — nada de "próximamente".
 */
const BENEFITS = [
  {
    title: "Todo en un solo lugar",
    body: "Menú, WhatsApp, redes, ubicación y reseñas, reunidos en tu página.",
  },
  {
    title: "Actualizable",
    body: "Cambiás la información de tu perfil cuando quieras, sin cambiar la placa física.",
  },
  {
    title: "NFC + QR",
    body: "Dos formas de llegar al mismo perfil: acercando el teléfono o escaneando.",
  },
  {
    title: "Diseñada para tu negocio",
    body: "Tu logo, tus colores y tu nombre — no una placa genérica de TapGoCR.",
  },
  {
    title: "Analytics",
    body: "Sabés cuántas veces te tocaron o escanearon, y qué botón usan más.",
  },
];

export function ValueSection() {
  return (
    <section id="beneficios" className="border-b border-border">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading eyebrow="Qué ganás" title="Una placa. Toda la plataforma detrás." />

        <ul className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="reveal lift rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{benefit.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
