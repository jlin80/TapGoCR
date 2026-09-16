"use client";

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
 * Lo que se "abre" en la pantalla al tocar cada botón. Contenido de ejemplo
 * para el negocio demo, igual de ficticio que su nombre y su logo — no son
 * datos reales de ningún cliente.
 */
const PREVIEWS: Partial<Record<LinkType, { label: string; render: () => React.ReactNode }>> = {
  [LinkType.MENU]: {
    label: "Ver menú",
    render: () => (
      <ul className="flex flex-col gap-2 text-[11px]">
        {[
          ["Hamburguesa ahumada", "₡3.500"],
          ["Papas con romero", "₡1.800"],
          ["Limonada de sandía", "₡1.500"],
        ].map(([item, price]) => (
          <li key={item} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <span>{item}</span>
            <span className="font-semibold text-muted">{price}</span>
          </li>
        ))}
      </ul>
    ),
  },
  [LinkType.WHATSAPP]: {
    label: "Pedir por WhatsApp",
    render: () => (
      <div className="flex flex-col gap-2">
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-[11px] text-brand-contrast">
          Hola 👋 ¿me arma una hamburguesa ahumada para llevar?
        </p>
        <p className="mr-auto max-w-[80%] rounded-2xl rounded-tl-sm bg-surface-muted px-3 py-2 text-[11px]">
          ¡Claro! Está lista en 15 minutos 🍔
        </p>
      </div>
    ),
  },
  [LinkType.INSTAGRAM]: {
    label: "Instagram",
    render: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {["#c1121f", "#f97316", "#b45309", "#7c2d12", "#c1121f", "#f97316"].map((color, i) => (
          <span
            key={i}
            className="aspect-square rounded-md"
            style={{ backgroundColor: color, opacity: 0.85 }}
          />
        ))}
      </div>
    ),
  },
  [LinkType.GOOGLE_REVIEWS]: {
    label: "Dejanos tu reseña",
    render: () => (
      <div className="flex flex-col gap-2 text-[11px]">
        <p aria-hidden="true" className="text-amber-500">★★★★★</p>
        <p className="text-muted">&quot;Las mejores hamburguesas ahumadas de la zona.&quot;</p>
      </div>
    ),
  },
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
          title="Un código. Varias cosas distintas."
          description="Elegí qué tocaría tu cliente y mirá cómo cambia la pantalla. Es el mismo código NFC/QR en los tres casos."
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

          <div className="w-[240px] overflow-hidden rounded-[2rem] border-[8px] border-slate-900 bg-surface shadow-xl dark:border-slate-700">
            <div className="flex justify-center bg-surface pt-2">
              <span className="h-1.5 w-14 rounded-full bg-slate-900/20 dark:bg-white/20" />
            </div>
            <div key={active} className="flex flex-col gap-3 p-4" style={{ animation: "tapgo-rise .3s ease-out both" }}>
              <p className="text-xs font-semibold text-muted">{DEMO.name}</p>
              {preview?.render()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
