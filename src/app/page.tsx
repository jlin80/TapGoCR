import type { Metadata } from "next";

import { AnalyticsSection } from "@/components/home/analytics-section";
import { AudiencesSection } from "@/components/home/audiences-section";
import { CapabilitiesSection } from "@/components/home/capabilities-section";
import { ContactSection } from "@/components/home/contact-section";
import { DifferentiationSection } from "@/components/home/differentiation-section";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { FloatingWhatsappCta } from "@/components/home/floating-whatsapp-cta";
import { GoalPickerSection } from "@/components/home/goal-picker-section";
import { HardwareSection } from "@/components/home/hardware-section";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { MissionSection } from "@/components/home/mission-section";
import { OwnershipSection } from "@/components/home/ownership-section";
import { PackagesSection } from "@/components/home/packages-section";
import { PricingTeaserSection } from "@/components/home/pricing-teaser-section";
import { ServicesSection } from "@/components/home/services-section";
import { SolutionsSection } from "@/components/home/solutions-section";
import { TapGoSection } from "@/components/home/tap-go-section";
import { TrustSection } from "@/components/home/trust-section";
import { TryItSection } from "@/components/home/try-it-section";
import { MotionPreview } from "@/components/motion-preview";
import { ScrollEffects } from "@/components/scroll-effects";
import { ScrollProgress, SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

/**
 * Sitio comercial de TapGoCR.
 *
 * Arquitectura orientada al funnel DESCUBRIR → ENTENDER → CONFIAR → ACTUAR:
 * el hero dice qué es en segundos, "qué puede hacer" y "cómo funciona"
 * explican sin hablar de tecnología, "soluciones" organiza por objetivo del
 * negocio (no por producto NFC), y recién después vienen precio, demo y
 * prueba social. Es la única página del proyecto pensada para buscadores.
 *
 * Cada tramo vive en su propio archivo bajo `src/components/home/`: reordenar
 * la landing es reordenar estas líneas, no bucear en un archivo de 450.
 */
export const metadata: Metadata = {
  title: `${appName} | Tu negocio, a un toque`,
  description:
    "Conectá a tus clientes con tu menú, WhatsApp, reseñas y redes con una placa NFC + QR para negocios en Costa Rica. Vos elegís qué querés, nosotros lo configuramos. Desde ₡9.900.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: `${appName} | Tu negocio, a un toque`,
    description:
      "Conectá a tus clientes con tu menú, WhatsApp, reseñas y redes con una placa NFC + QR. Vos elegís qué querés, nosotros lo configuramos.",
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
        <GoalPickerSection />
        <CapabilitiesSection />
        <TapGoSection />
        <HowItWorksSection />
        <SolutionsSection />
        <DifferentiationSection />
        <OwnershipSection />
        <HardwareSection />
        <AudiencesSection />
        <AnalyticsSection />
        <TryItSection />
        <TrustSection />
        <PricingTeaserSection />
        <PackagesSection />
        <ServicesSection />
        <MissionSection />
        <FaqSection />
        <FinalCtaSection />
        <ContactSection />
      </main>

      <SiteFooter home />
      <FloatingWhatsappCta />
    </>
  );
}
