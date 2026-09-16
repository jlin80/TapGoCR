import type { Metadata } from "next";

import { GoogleReviewsSection, WhatsappSection } from "@/components/home/action-sections";
import { AnalyticsSection } from "@/components/home/analytics-section";
import { AudiencesSection } from "@/components/home/audiences-section";
import { ContactSection } from "@/components/home/contact-section";
import { DifferentiationSection } from "@/components/home/differentiation-section";
import { DualViewSection } from "@/components/home/dual-view-section";
import { FaqSection } from "@/components/home/faq-section";
import { FloatingBrandButton } from "@/components/home/floating-brand-button";
import { HardwareSection } from "@/components/home/hardware-section";
import { HeroSection } from "@/components/home/hero-section";
import { HighlightsSection } from "@/components/home/highlights-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { MissionSection } from "@/components/home/mission-section";
import { OwnershipSection } from "@/components/home/ownership-section";
import { PackagesSection } from "@/components/home/packages-section";
import { PricingTeaserSection } from "@/components/home/pricing-teaser-section";
import { ProblemSection } from "@/components/home/problem-section";
import { ServicesSection } from "@/components/home/services-section";
import { TrustSection } from "@/components/home/trust-section";
import { TryItSection } from "@/components/home/try-it-section";
import { MotionPreview } from "@/components/motion-preview";
import { ScrollEffects } from "@/components/scroll-effects";
import { ScrollProgress, SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

/**
 * Sitio comercial de TapGoCR.
 *
 * Es la única página del proyecto pensada para buscadores, así que la única
 * indexable. No lee la sesión a propósito: el enlace de ingreso va a /login,
 * que ya redirige a cada quien a su panel.
 *
 * Cada tramo vive en su propio archivo bajo `src/components/home/`: es la
 * misma página de siempre —una sola URL, un solo scroll—, solo que este
 * archivo ahora arma el orden en vez de cargar con el contenido de las diez
 * secciones. Reordenar la landing es reordenar estas líneas, no bucear en un
 * archivo de 450.
 */
export const metadata: Metadata = {
  title: `${appName} | Convertí cualquier punto físico en una interacción digital`,
  description:
    "Comprá tu placa TapGo una sola vez, sin mensualidad obligatoria. Activá TapGo Smart cuando quieras sumar analytics, contenido dinámico y control total.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${appName} | Tu placa es tuya. TapGo la hace inteligente.`,
    description:
      "Comprá tu placa una sola vez. Activá TapGo Smart cuando quieras convertirla en una herramienta inteligente.",
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
        <OwnershipSection />
        <HighlightsSection />
        <ProblemSection />
        <HowItWorksSection />
        <DifferentiationSection />
        <DualViewSection />
        <TryItSection />
        <AnalyticsSection />
        <WhatsappSection />
        <GoogleReviewsSection />
        <AudiencesSection />
        <HardwareSection />
        <PackagesSection />
        <PricingTeaserSection />
        <ServicesSection />
        <TrustSection />
        <MissionSection />
        <FaqSection />
        <ContactSection />
      </main>

      <SiteFooter home />
      <FloatingBrandButton />
    </>
  );
}
