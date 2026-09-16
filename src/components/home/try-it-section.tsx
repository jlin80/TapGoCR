"use client";

import Image from "next/image";
import { useState } from "react";

import { LinkIcon } from "@/components/link-icon";
import { SectionHeading } from "@/components/marketing";
import { SHOWCASES } from "@/components/phone-showcase";
import { cx } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";

/**
 * Negocio de ejemplo fijo (el primero del carrusel del hero, "Ceniza y
 * Brasa"): acá no rota — el punto es que la persona elija ella qué botón
 * tocar, no que vea varios rubros pasar.
 */
const DEMO = SHOWCASES[0];

/**
 * Capturas de ejemplo del mismo negocio demo, ya con su propio marco de
 * teléfono — por eso el componente no dibuja un segundo marco alrededor.
 * Contenido de ejemplo, igual de ficticio que el negocio — no son datos
 * reales de ningún cliente.
 */
const PREVIEWS: Partial<Record<LinkType, { label: string; src: string }>> = {
  [LinkType.MENU]: { label: "Ver menú", src: "/demo-showcase/menu.png" },
  [LinkType.WHATSAPP]: { label: "Pedir por WhatsApp", src: "/demo-showcase/whatsapp.png" },
  [LinkType.INSTAGRAM]: { label: "Instagram", src: "/demo-showcase/instagram.png" },
  [LinkType.GOOGLE_REVIEWS]: { label: "Dejanos tu reseña", src: "/demo-showcase/resenas.png" },
};

const OPTIONS = DEMO.links.filter((link) => PREVIEWS[link.type]);

/**
 * "Probalo vos mismo": a diferencia del teléfono del hero (que rota entre
 * rubros para mostrar variedad), acá el negocio queda fijo y es la persona
 * quien elige qué botón tocar — la demostración real de que un solo código
 * abre varias cosas distintas.
 */
export function TryItSection() {
  const [active, setActive] = useState<LinkType>(OPTIONS[0].type);
  const preview = PREVIEWS[active];

  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Probalo vos mismo"
          title="No tenés que imaginártelo."
          description="Elegí qué tocaría tu cliente y mirá cómo cambia la pantalla. Es el mismo código NFC/QR en todos los casos."
        />
        <p className="reveal mt-4 text-center text-xs text-muted">
          Ejemplo de cómo podría verse tu negocio — {DEMO.name} no es un cliente real.
        </p>

        <div className="reveal mt-10 flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-2">
            {OPTIONS.map((link) => (
              <button
                key={link.type}
                type="button"
                aria-pressed={active === link.type}
                onClick={() => setActive(link.type)}
                className={cx(
                  "tap-target inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active === link.type
                    ? "border-brand bg-brand text-brand-contrast"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <LinkIcon type={link.type} className="size-4" />
                {link.label}
              </button>
            ))}
          </div>

          {preview ? (
            <div
              key={active}
              className="w-[220px] sm:w-[240px]"
              style={{ animation: "tapgo-rise .3s ease-out both" }}
            >
              <Image
                src={preview.src}
                alt={`${preview.label} — ejemplo en el teléfono`}
                width={1086}
                height={1448}
                className="h-auto w-full drop-shadow-xl"
                sizes="(min-width: 640px) 240px, 220px"
                priority={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
