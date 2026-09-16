import { SectionHeading } from "@/components/marketing";

/**
 * Objeciones reales antes de escribir o llamar: instalación, compatibilidad,
 * cambios de contenido, dominios propios, cancelación y datos. Las preguntas
 * específicas de cada rubro viven aparte, en `industry.faq` (`/[industry]`).
 */
const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Por qué no compro un sticker NFC por mi cuenta?",
    a: "Podés hacerlo. Un sticker NFC por sí solo puede abrir un enlace. TapGoCR agrega la página de tu negocio, QR, administración, contenido actualizable, analytics y soporte para convertir esa interacción en una herramienta útil para tu negocio.",
  },
  {
    q: "¿Necesito instalar una app?",
    a: "No. El cliente acerca el teléfono a la placa NFC o escanea el QR con la cámara, y el navegador abre la página del negocio directamente.",
  },
  {
    q: "¿Puedo usar NFC y QR al mismo tiempo?",
    a: "Sí, siempre van juntos en la misma placa: si el teléfono no tiene NFC o lo tiene desactivado, el QR impreso lleva exactamente al mismo lugar.",
  },
  {
    q: "¿Funciona en iPhone?",
    a: "Sí, con la cámara nativa para el QR y por NFC desde iOS 14 en adelante, sin instalar nada.",
  },
  {
    q: "¿Funciona en Android?",
    a: "Sí, igual que en iPhone: cámara para el QR, y NFC activado por defecto en la gran mayoría de equipos.",
  },
  {
    q: "¿Qué pasa si cambio mi menú?",
    a: "Lo actualizás desde tu panel y se ve al instante en todas tus placas. La placa nunca guarda el contenido, solo apunta a tu página.",
  },
  {
    q: "¿Tengo que cambiar el QR cada vez que actualizo algo?",
    a: "No. El código impreso o programado no cambia nunca; lo que muestra del otro lado sí, y lo controlás vos.",
  },
  {
    q: "¿Funciona si el cliente no tiene NFC?",
    a: "Sí. El QR siempre está impreso en la misma placa como alternativa: si el teléfono no tiene NFC o lo tiene desactivado, la cámara escanea el QR y llega al mismo lugar.",
  },
  {
    q: "¿Puedo tener múltiples placas?",
    a: "Sí. Cada plan incluye una cantidad de placas activas (mesa, entrada, mostrador, etc.) y podés agregar más cuando las necesités.",
  },
  {
    q: "¿Puedo agregar otra sucursal?",
    a: "Sí, con el plan Chain: cada sucursal tiene su propia página y sus propias placas, con analytics comparado entre sucursales.",
  },
  {
    q: "¿Puedo saber qué placa recibe más interacciones?",
    a: "Sí, cada placa tiene su propio historial de escaneos y clics en tu panel de analytics, para saber cuál está funcionando mejor.",
  },
  {
    q: "¿Puedo usar mi propio dominio?",
    a: "Sí, es un servicio que gestionamos con vos: pedís el dominio desde tu panel y coordinamos el registro y la configuración.",
  },
  {
    q: "¿Hay límite de escaneos?",
    a: "No. Los escaneos y clics son siempre ilimitados; lo que varía entre planes es la cantidad de placas activas.",
  },
  {
    q: "¿Qué ocurre si cancelo?",
    a: "Tus placas dejan de mostrar tu página, pero podés reactivar cuando quieras. No perdés el historial mientras la cuenta siga existiendo.",
  },
  {
    q: "¿Qué ocurre con mis datos?",
    a: "Son tuyos. No los compartimos con terceros ni los usamos para otra cosa que mostrar tu página y tus estadísticas.",
  },
];

/** Marca cada pregunta como tal para buscadores, sin depender de una librería. */
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:py-24 lg:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <SectionHeading
        eyebrow="Preguntas frecuentes"
        title="Antes de que preguntes"
        description="Las dudas que más nos hacen antes de probar TapGoCR."
      />
      <div className="mt-10 flex flex-col gap-6">
        {FAQ.map((item) => (
          <div key={item.q} className="reveal rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-2 text-sm text-muted">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
