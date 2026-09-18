import type { Metadata } from "next";

import { AnalyticsSection } from "@/components/home/analytics-section";
import { AudiencesSection } from "@/components/home/audiences-section";
import { ContactSection } from "@/components/home/contact-section";
import { DeliverySection } from "@/components/home/delivery-section";
import { DifferentiationSection } from "@/components/home/differentiation-section";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { FloatingWhatsappCta } from "@/components/home/floating-whatsapp-cta";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { OwnershipSection } from "@/components/home/ownership-section";
import { PackagesSection } from "@/components/home/packages-section";
import { PricingTeaserSection } from "@/components/home/pricing-teaser-section";
import { ProblemSection } from "@/components/home/problem-section";
import { TryItSection } from "@/components/home/try-it-section";
import { ValueSection } from "@/components/home/value-section";
import { WhatIsSection } from "@/components/home/what-is-section";
import { WhatYouGetSection } from "@/components/home/what-you-get-section";
import { MotionPreview } from "@/components/motion-preview";
import { ScrollEffects } from "@/components/scroll-effects";
import { ScrollProgress, SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

/**
 * Sitio comercial de TapGoCR.
 *
 * TapGoCR vende placas NFC + QR personalizadas — nunca stickers ni otros
 * formatos genéricos. El recorrido sigue un solo hilo comercial, en este
 * orden exacto: qué compro (hero) → por qué lo necesito (problema) → qué es
 * (diagrama placa→tocar/escanear→página) → qué recibo físicamente → cómo
 * funciona (3 pasos) → prueba real interactiva (demo) → para quién sirve
 * (casos de uso) → por qué esto y no un QR suelto (diferenciación) → cuánto
 * cuesta (precios) → pedidos grandes → placa vs. plataforma (pago único vs.
 * mensualidad) → cómo llega (proceso de entrega) → qué gano (beneficios) →
 * analytics → dudas (FAQ) → cómo empiezo (CTA final).
 *
 * Cada tramo vive en su propio archivo bajo `src/components/home/`: reordenar
 * la landing es reordenar estas líneas, no bucear en un archivo gigante.
 */
export const metadata: Metadata = {
  title: `${appName} | Placas NFC + QR para negocios`,
  description:
    "Placa NFC + QR personalizada que conecta a tus clientes con tu menú, WhatsApp, reseñas y redes en un solo toque. Nosotros la diseñamos y configuramos. Desde ₡9.900.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${appName} | Placas NFC + QR para negocios`,
    description:
      "Placa NFC + QR personalizada que conecta a tus clientes con tu menú, WhatsApp, reseñas y redes en un solo toque.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <ScrollEffects />
      <MotionPreview />

      <SiteHeader home />

      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <WhatIsSection />
        <WhatYouGetSection />
        <HowItWorksSection />
        <TryItSection />
        <AudiencesSection />
        <DifferentiationSection />
        <PricingTeaserSection />
        <PackagesSection />
        <OwnershipSection />
        <DeliverySection />
        <ValueSection />
        <AnalyticsSection />
        <FaqSection />
        <FinalCtaSection />
        <ContactSection />
      </main>

      <SiteFooter home />
      <FloatingWhatsappCta />
    </>
  );
}
