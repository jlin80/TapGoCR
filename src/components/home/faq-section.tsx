import { SectionHeading } from "@/components/marketing";

/**
 * Objeciones reales antes de escribir o llamar: qué incluye la placa,
 * compatibilidad, cambios de contenido, cantidad de placas y datos. Las
 * preguntas específicas de cada rubro viven aparte, en `industry.faq`
 * (`/[industry]`).
 */
const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué recibo?",
    a: "Tu placa personalizada con chip NFC y código QR, más el acceso a tu página digital: logo, enlaces, menú, WhatsApp, redes, ubicación y reseñas. Nosotros la diseñamos, la configuramos y te la entregamos lista para instalar.",
  },
  {
    q: "¿La placa es mía?",
    a: "Sí. La compra de la placa es un pago único y es tuya. La plataforma que la hace funcionar (analytics, panel, actualizaciones) tiene una mensualidad según tu plan.",
  },
  {
    q: "¿Cómo funciona el NFC?",
    a: "Tu cliente acerca su teléfono a la placa y el navegador abre tu página directamente, sin instalar nada. La mayoría de teléfonos de los últimos años lo soportan de fábrica.",
  },
  {
    q: "¿También tiene QR?",
    a: "Sí. Cada placa lleva también un código QR impreso: si el teléfono no tiene NFC o lo tiene desactivado, la cámara escanea el QR y llega exactamente al mismo lugar.",
  },
  {
    q: "¿Necesito una aplicación?",
    a: "No, en iPhone ni en Android. El cliente acerca el teléfono a la placa o escanea el QR con la cámara, y el navegador abre tu página directamente.",
  },
  {
    q: "¿Puedo cambiar la información de mi negocio?",
    a: "Sí, cuando quieras y las veces que quieras, desde tu panel. La placa física nunca cambia; lo que abre del otro lado sí, y lo controlás vos.",
  },
  {
    q: "¿Qué incluye la mensualidad?",
    a: "La plataforma que hace funcionar tu placa: página digital, panel de administración, actualizaciones y analytics. El detalle exacto varía según tu plan.",
  },
  {
    q: "¿Cómo recibo mi placa?",
    a: "Nos compartís la información de tu negocio, nosotros configuramos tu página y preparamos tu placa con tu diseño. Te la entregamos lista para instalar.",
  },
  {
    q: "¿Dónde puedo colocarla?",
    a: "Donde tus clientes la vean con facilidad: la mesa, el mostrador, la entrada o la caja. Es una placa física, así que va donde tenga sentido para tu negocio.",
  },
  {
    q: "¿Puedo tener varias placas?",
    a: "Sí. La cantidad incluida depende de tu plan, y podés pedir placas adicionales cuando las necesités — cada una con su propio código y sus propias estadísticas.",
  },
  {
    q: "¿Hacen entregas en Costa Rica?",
    a: "Sí, a todo el país.",
  },
  {
    q: "¿Cuánto tarda en estar lista?",
    a: "Depende de tu diseño y de qué tan rápido nos compartís la información de tu negocio. Te confirmamos el tiempo exacto cuando armamos tu pedido.",
  },
  {
    q: "¿Qué pasa si dejo de pagar la mensualidad?",
    a: "La placa física sigue siendo tuya. Tu página digital y el panel de administración quedan pausados hasta que reactivés la suscripción.",
  },
  {
    q: "¿Puedo usar mi propia marca?",
    a: "Sí. Tu placa se diseña con tu logo, tus colores y tu nombre — no es una placa genérica de TapGoCR.",
  },
  {
    q: "¿Puedo agregar mi sitio web?",
    a: "Sí, un enlace a tu sitio web es una de las opciones disponibles, junto con menú, WhatsApp, redes, ubicación y reseñas.",
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
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16 sm:py-20 lg:py-24">
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
