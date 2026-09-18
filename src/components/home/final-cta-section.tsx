import { LinkButton } from "@/components/ui";
import { contactWhatsappUrl } from "@/lib/config";

/**
 * Cierre de la página: repite el mensaje del hero ("todo tu negocio, en una
 * sola placa") a propósito — es la última impresión antes de decidir, y debe
 * ser tan clara como la primera. El botón de WhatsApp solo aparece si hay un
 * número configurado (`NEXT_PUBLIC_CONTACT_WHATSAPP`): sin eso, "Hablar por
 * WhatsApp" apuntaría a ningún lado.
 */
const TRUST_LINE = "Hecho en Costa Rica · Configuración incluida · Soporte incluido";

export function FinalCtaSection() {
  return (
    <section className="on-dark border-b border-border">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
          Todo tu negocio.
          <br />
          En una sola placa.
        </h2>
        <p className="reveal mx-auto mt-4 max-w-xl text-base text-muted text-pretty sm:text-lg">
          Conectá a tus clientes con lo que necesitan, desde un solo toque.
        </p>

        <p className="reveal mt-4 text-sm text-muted">
          Desde <strong className="font-semibold text-foreground">₡9.900</strong> +{" "}
          <strong className="font-semibold text-foreground">₡1.990/mes</strong>
        </p>

        <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="#contacto" variant="primary" className="px-7 py-3.5 text-base">
            Quiero mi TapGo
          </LinkButton>
          {contactWhatsappUrl ? (
            <LinkButton
              href={contactWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="px-7 py-3.5 text-base"
            >
              Hablar por WhatsApp
            </LinkButton>
          ) : (
            <LinkButton href="/precios" variant="secondary" className="px-7 py-3.5 text-base">
              Ver planes
            </LinkButton>
          )}
        </div>

        <p className="reveal mt-4 text-sm text-muted">Configuramos todo por vos.</p>

        <p className="reveal mt-10 text-xs tracking-wide text-muted uppercase">{TRUST_LINE}</p>
      </div>
    </section>
  );
}
