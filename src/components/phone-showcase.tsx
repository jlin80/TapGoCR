"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { LinkIcon } from "@/components/link-icon";
import { cx } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";
import { contrastColor, shade } from "@/lib/color";
import { appName } from "@/lib/config";

/**
 * Teléfono del hero, mostrando cómo se ve la landing de distintos rubros.
 *
 * Va rotando solo para dar a entender de un vistazo que sirve para cualquier
 * negocio, no solo para restaurantes. Si la persona pidió menos movimiento se
 * queda quieto en el primero y solo cambia si toca los puntos.
 */
type Showcase = {
  /** Logo real generado con Canva, servido desde /public/demo-logos. */
  logo: string;
  name: string;
  tagline: string;
  /**
   * Color de marca del negocio, en el mismo formato que el cliente configura
   * desde "Mi página pública". Que cada ejemplo tenga el suyo no es decoración:
   * es lo que demuestra, sin explicarlo, que la landing toma la identidad del
   * negocio y no la de TapGoCR.
   */
  brand: string;
  /** Foto real (Unsplash, libre de uso comercial) que ambienta el rubro en la portada. */
  cover: string;
  links: Array<{ type: LinkType; label: string }>;
};

export const SHOWCASES: Showcase[] = [
  {
    logo: "/demo-logos/ceniza-y-brasa.png",
    name: "Ceniza y Brasa",
    tagline: "Hamburguesas ahumadas a la leña",
    brand: "#c1121f",
    cover:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?fm=jpg&q=60&w=800&auto=format&fit=crop",
    links: [
      { type: LinkType.MENU, label: "Ver menú" },
      { type: LinkType.WHATSAPP, label: "Pedir por WhatsApp" },
      { type: LinkType.INSTAGRAM, label: "Instagram" },
      { type: LinkType.GOOGLE_MAPS, label: "Cómo llegar" },
      { type: LinkType.GOOGLE_REVIEWS, label: "Dejanos tu reseña" },
    ],
  },
  {
    logo: "/demo-logos/sesgo-cafe.png",
    name: "Sesgo Café",
    tagline: "Café de altura, tostado propio",
    brand: "#b45309",
    cover:
      "https://images.unsplash.com/photo-1752756992329-961db6366376?fm=jpg&q=60&w=800&auto=format&fit=crop",
    links: [
      { type: LinkType.MENU, label: "Ver carta" },
      { type: LinkType.INSTAGRAM, label: "Seguinos" },
      { type: LinkType.WHATSAPP, label: "Pedidos para llevar" },
      { type: LinkType.GOOGLE_REVIEWS, label: "Dejanos tu reseña" },
    ],
  },
  {
    logo: "/demo-logos/barberia-del-zaguan.png",
    name: "Barbería del Zaguán",
    tagline: "Cortes y afeitado clásico",
    brand: "#1d4ed8",
    cover:
      "https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?fm=jpg&q=60&w=800&auto=format&fit=crop",
    links: [
      { type: LinkType.CUSTOM, label: "Reservar cita" },
      { type: LinkType.WHATSAPP, label: "WhatsApp" },
      { type: LinkType.INSTAGRAM, label: "Ver trabajos" },
      { type: LinkType.GOOGLE_MAPS, label: "Cómo llegar" },
      { type: LinkType.GOOGLE_REVIEWS, label: "Calificanos" },
    ],
  },
  {
    logo: "/demo-logos/cabo-suelto.png",
    name: "Cabo Suelto",
    tagline: "Hostal frente al mar, Guanacaste",
    brand: "#0e7490",
    cover:
      "https://images.unsplash.com/photo-1760815153715-9fce4c3644a3?fm=jpg&q=60&w=800&auto=format&fit=crop",
    links: [
      { type: LinkType.WEBSITE, label: "Ver habitaciones" },
      { type: LinkType.WHATSAPP, label: "Reservar" },
      { type: LinkType.MENU, label: "Carta del restaurante" },
      { type: LinkType.GOOGLE_MAPS, label: "Cómo llegar" },
      { type: LinkType.INSTAGRAM, label: "Instagram" },
    ],
  },
];

const ROTATION_MS = 4500;

export function PhoneShowcase() {
  const [index, setIndex] = useState(0);
  // Se detiene en cuanto la persona elige un ejemplo a mano: pasa a mandar ella.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setIndex((current) => (current + 1) % SHOWCASES.length),
      ROTATION_MS,
    );
    return () => clearInterval(timer);
  }, [paused]);

  const showcase = SHOWCASES[index];

  return (
    <div className="relative mx-auto w-fit">
      {/* Ondas NFC saliendo del teléfono. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {[0, 1, 2].map((ring) => (
          <span
            key={ring}
            className="nfc-ring absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand/40"
            style={{ animationDelay: `${ring}s` }}
          />
        ))}
      </div>

      <div className="float-slow">
        <div className="w-[272px] overflow-hidden rounded-[2.4rem] border-[10px] border-slate-900 bg-surface shadow-2xl dark:border-slate-700">
          <div className="flex justify-center bg-surface pt-2.5">
            <span className="h-1.5 w-16 rounded-full bg-slate-900/20 dark:bg-white/20" />
          </div>

          {/*
            Los colores del negocio se inyectan como variables CSS, igual que en
            la landing real (`themeStyle`): el mockup y la página que ve el
            cliente final se pintan con el mismo mecanismo, así que lo que se
            enseña acá es exactamente lo que se entrega.
          */}
          <div
            key={showcase.name}
            className="flex flex-col items-center pb-6"
            style={{
              animation: "tapgo-rise .45s ease-out both",
              "--brand": showcase.brand,
              "--brand-contrast": contrastColor(showcase.brand),
            } as CSSProperties}
          >
            {/*
              Portada: foto real del rubro (Unsplash, uso libre) con un velo del
              color de marca encima, igual que el cliente puede subir su propia
              portada y TapGoCR la tiñe con su identidad.
            */}
            <div
              className="h-16 w-full bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(135deg, ${showcase.brand}cc, ${shade(showcase.brand, -0.2)}cc), url(${showcase.cover})`,
              }}
            />

            <div className="-mt-8 size-16 overflow-hidden rounded-full border-4 border-surface shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- asset local en /public, no hace falta next/image acá */}
              <img
                src={showcase.logo}
                alt={showcase.name}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            </div>
            <p className="mt-3 font-semibold">{showcase.name}</p>
            <p className="text-[11px] text-muted">{showcase.tagline}</p>

            <div className="mt-4 flex w-full flex-col gap-2 px-4">
              {showcase.links.map((link) => (
                <div
                  key={link.label}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-[11px] font-medium shadow-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/12 text-brand">
                    <LinkIcon type={link.type} className="size-3.5" />
                  </span>
                  <span className="flex-1 text-left">{link.label}</span>
                  <span className="text-muted">&rsaquo;</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[9px] text-muted">Powered by {appName}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {SHOWCASES.map((item, position) => (
          <button
            key={item.name}
            type="button"
            aria-label={`Ver ejemplo de ${item.name}`}
            aria-current={position === index}
            onClick={() => {
              setPaused(true);
              setIndex(position);
            }}
            className={cx(
              "h-2 rounded-full transition-all",
              position === index ? "w-7" : "w-2 bg-border hover:bg-muted",
            )}
            // El punto activo toma el color del negocio que representa.
            style={position === index ? { backgroundColor: item.brand } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
