
import { ContactForm } from "@/components/contact-form";
import { Blobs, SectionHeading } from "@/components/marketing";
import { LinkButton } from "@/components/ui";
import {
  contactEmail,
  contactWhatsapp,
  contactWhatsappUrl,
  formatWhatsapp,
} from "@/lib/config";

/** Formulario de contacto y vías directas, al final de la landing. */
export function ContactSection() {
  return (
    <section id="contacto" className="relative overflow-hidden bg-surface-muted">
      <Blobs />

      <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="Quiero mi TapGo"
          title="Contanos sobre tu negocio"
          description="Elegí tu rubro y qué querés conseguir. Nosotros armamos la propuesta y la configuración — vos no tenés que resolver nada técnico."
        />

        {/* `zoom-in` reemplaza a `reveal`: son dos animaciones sobre el
            mismo elemento y la segunda ganaría igual. */}
        <div className="zoom-in mt-12">
          <ContactForm />
        </div>

        <p className="reveal mt-6 text-center text-sm text-muted">
          ¿Ya lo tenés decidido?{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
          <a href="/registro" className="text-brand hover:underline">
            Registrá tu negocio
          </a>{" "}
          y coordinamos la instalación.
        </p>

        {contactWhatsappUrl || contactEmail ? (
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted">O escribinos directo:</span>
            {contactWhatsappUrl ? (
              <LinkButton href={contactWhatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
                {contactWhatsapp ? ` · ${formatWhatsapp(contactWhatsapp)}` : ""}
              </LinkButton>
            ) : null}
            {contactEmail ? (
              <LinkButton href={`mailto:${contactEmail}`}>{contactEmail}</LinkButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
