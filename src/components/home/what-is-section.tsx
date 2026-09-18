import { SectionHeading } from "@/components/marketing";
import { LinkIcon } from "@/components/link-icon";
import { LinkType } from "@/generated/prisma/enums";

/**
 * Responde "¿qué es esto?" con un diagrama, no con un párrafo: placa → tocar
 * o escanear → página del negocio. Los íconos del teléfono son los mismos
 * `LinkType` reales que soporta el sistema (ver `link-icon.tsx`), no una
 * lista inventada.
 */
const CHANNELS: LinkType[] = [
  LinkType.WHATSAPP,
  LinkType.MENU,
  LinkType.INSTAGRAM,
  LinkType.GOOGLE_REVIEWS,
  LinkType.GOOGLE_MAPS,
];

export function WhatIsSection() {
  return (
    <section id="que-es" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="¿Qué es TapGo?"
          title="Una placa. Todos tus canales."
          description="TapGoCR convierte una interacción física en una experiencia digital para tu negocio."
        />

        <div className="reveal mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-14 items-center justify-center rounded-xl border-2 border-brand bg-surface shadow-lg shadow-brand/10">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tu placa</p>
          </div>

          <span aria-hidden="true" className="text-2xl text-brand/50 sm:rotate-0 rotate-90">
            →
          </span>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-8 text-brand" aria-hidden="true">
                <path d="M8 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8Zm4 15.5h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tocás o escaneás</p>
          </div>

          <span aria-hidden="true" className="text-2xl text-brand/50 sm:rotate-0 rotate-90">
            →
          </span>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface p-2">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {CHANNELS.map((type) => (
                  <span key={type} className="text-brand">
                    <LinkIcon type={type} className="size-3.5" />
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tu página</p>
          </div>
        </div>

        <p className="reveal mt-10 text-sm text-muted">
          Sin leer nada: tu cliente toca o escanea, y ahí mismo elige qué hacer.
        </p>
      </div>
    </section>
  );
}
