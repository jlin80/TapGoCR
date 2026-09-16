import Image from "next/image";

import { IconMarquee } from "@/components/marketing";
import { CrossOriginLinkButton, LinkButton } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";

const DESTINATIONS: Array<{ type: LinkType; label: string }> = [
  { type: LinkType.MENU, label: "Menú" },
  { type: LinkType.WHATSAPP, label: "WhatsApp" },
  { type: LinkType.INSTAGRAM, label: "Instagram" },
  { type: LinkType.TIKTOK, label: "TikTok" },
  { type: LinkType.FACEBOOK, label: "Facebook" },
  { type: LinkType.GOOGLE_REVIEWS, label: "Reseñas de Google" },
  { type: LinkType.GOOGLE_MAPS, label: "Cómo llegar" },
  { type: LinkType.WEBSITE, label: "Sitio web" },
  { type: LinkType.CUSTOM, label: "Lo que se te ocurra" },
];

/** Mensajes de confianza cortos, justo debajo del CTA — reducen fricción sin competir con el título. */
const TRUST_ITEMS: Array<{ label: string; path: string }> = [
  { label: "NFC + QR", path: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z" },
  { label: "Sin apps", path: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h4" },
  { label: "Personalizado", path: "M12 2 4 5v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V5l-8-3Z" },
  { label: "Listo para usar", path: "m5 13 4 4 10-11" },
];

/**
 * Hero de la landing.
 *
 * Composición fotográfica: la foto de referencia domina el lado derecho, con
 * un degradado horizontal que la funde hacia el navy sólido del lado
 * izquierdo (donde vive el contenido real, en HTML — nada de texto
 * incrustado en la imagen). En mobile el degradado pasa a vertical y la foto
 * queda detrás del contenido, no al lado.
 */
export function HeroSection() {
  return (
    <>
      <section className="marketing-hero relative flex items-center overflow-hidden lg:min-h-screen">
        <Image
          src="/brand/hero-restaurant.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[58%_52%] lg:object-[62%_42%]"
        />

        {/*
          Dos juegos de overlay, siempre los dos en el DOM — el CSS decide
          cuál se ve según `[data-theme]` (ver globals.css). La foto de arriba
          no lleva ninguna de estas clases: permanece idéntica entre temas,
          solo cambia el tratamiento encima.
        */}
        <div
          aria-hidden="true"
          className="hero-overlay-dark absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, #0F172A 0%, #0F172A 25%, rgba(15,23,42,.92) 42%, rgba(15,23,42,.55) 58%, rgba(15,23,42,.08) 75%, rgba(15,23,42,0) 88%)",
          }}
        />
        <div
          aria-hidden="true"
          className="hero-overlay-dark absolute inset-0 hidden lg:block"
          style={{
            background:
              "radial-gradient(60% 55% at 22% 45%, rgba(15,23,42,.35) 0%, rgba(15,23,42,0) 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="hero-overlay-dark absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,.35) 0%, rgba(15,23,42,.55) 30%, rgba(15,23,42,.93) 52%, #0F172A 68%, #0F172A 100%)",
          }}
        />

        {/* Misma composición en marfil/off-white, para el tema claro. */}
        <div
          aria-hidden="true"
          className="hero-overlay-light absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, #F6F3EC 0%, #F6F3EC 25%, rgba(246,243,236,.92) 42%, rgba(246,243,236,.6) 58%, rgba(246,243,236,.1) 75%, rgba(246,243,236,0) 88%)",
          }}
        />
        <div
          aria-hidden="true"
          className="hero-overlay-light absolute inset-0 hidden lg:block"
          style={{
            background:
              "radial-gradient(60% 55% at 22% 45%, rgba(246,243,236,.4) 0%, rgba(246,243,236,0) 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="hero-overlay-light absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(246,243,236,.4) 0%, rgba(246,243,236,.6) 30%, rgba(246,243,236,.95) 52%, #F6F3EC 68%, #F6F3EC 100%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-[46vw] pb-14 sm:pt-56 sm:pb-20 lg:py-32">
          <div className="max-w-xl lg:w-[46%]">
            <h1 className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl lg:text-6xl">
              Tu negocio,
              <br />
              <span className="text-brand">a un toque.</span>
            </h1>

            <p className="mt-5 max-w-md text-base text-muted text-pretty sm:mt-6 sm:text-lg">
              Conectá a tus clientes con tu menú, WhatsApp, reseñas, redes y
              mucho más.
            </p>

            <p className="mt-3 max-w-md text-base font-medium text-pretty sm:text-lg">
              Vos elegís qué querés. Nosotros lo configuramos por vos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              {/*
                Camino principal de venta: contanos qué necesitás y armamos la
                propuesta (sección de contacto, más abajo en la misma página)
                — no un registro largo. "Crear mi cuenta" sigue disponible
                como camino secundario para quien ya está listo.
              */}
              <LinkButton
                href="#contacto"
                variant="primary"
                className="px-7 py-3.5 text-base shadow-xl shadow-brand/30"
              >
                Quiero mi TapGo
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4"
                >
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </LinkButton>

              <CrossOriginLinkButton href="/registro" variant="secondary" className="px-7 py-3.5 text-base">
                Crear mi cuenta
              </CrossOriginLinkButton>
            </div>

            <p className="mt-4 text-sm text-muted">
              Desde <strong className="font-semibold text-foreground">₡9.900</strong> de pago
              inicial. Plataforma desde{" "}
              <strong className="font-semibold text-foreground">₡1.990/mes</strong>.
            </p>

            {/* Micro-indicadores de confianza: no compiten con el H1, van chicos y en una fila. */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 sm:mt-12">
              {TRUST_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm text-muted">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-4 text-brand"
                  >
                    <path d={item.path} />
                  </svg>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted py-10">
        <p className="mb-8 text-center text-sm font-semibold tracking-widest text-muted uppercase">
          Todo lo que puede abrir una placa
        </p>
        <IconMarquee items={DESTINATIONS} />
      </section>
    </>
  );
}
