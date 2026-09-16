import { LinkIcon } from "@/components/link-icon";
import { SectionHeading } from "@/components/marketing";
import { LinkType } from "@/generated/prisma/enums";

/**
 * Dos bloques cortos y muy visuales, uno por acción principal que un TapGo
 * puede facilitar: WhatsApp (conversación directa) y reseñas de Google
 * (cerrar el ciclo después de una buena experiencia). Ninguno promete
 * resultados ni funcionalidades que no existen — el enlace de WhatsApp abre
 * `wa.me` con el número del negocio, sin mensaje prellenado.
 */
function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="reveal mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
      {steps.map((step, index) => (
        <span key={step} className="contents">
          {index > 0 ? (
            <span aria-hidden="true" className="text-brand">
              &rarr;
            </span>
          ) : null}
          <span className="rounded-full border border-border bg-surface px-4 py-2">
            {step}
          </span>
        </span>
      ))}
    </div>
  );
}

export function WhatsappSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="WhatsApp"
          title="De una visita a una conversación."
          description="Permití que tus clientes te contacten directamente por WhatsApp desde tu TapGo."
        />
        <Flow steps={["Toque", "WhatsApp", "Conversación"]} />
        <div className="reveal mt-8 flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <LinkIcon type={LinkType.WHATSAPP} className="size-7" />
          </span>
        </div>
      </div>
    </section>
  );
}

export function GoogleReviewsSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Reseñas"
          title="Convertí una interacción en una reseña."
          description="Después de una buena experiencia, facilitale al cliente dejar una reseña en Google."
        />
        <Flow steps={["Cliente", "TapGo", "Experiencia", "Reseña en Google"]} />
        <div className="reveal mt-8 flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/12 text-brand">
            <LinkIcon type={LinkType.GOOGLE_REVIEWS} className="size-7" />
          </span>
        </div>
      </div>
    </section>
  );
}
