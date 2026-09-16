import Link from "next/link";
import type { ReactNode } from "react";

import { BrandWordmark, HeaderLogo } from "@/components/brand";
import { LinkIcon } from "@/components/link-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { CrossOriginLinkButton, cx, LinkButton } from "@/components/ui";
import type { LinkType } from "@/generated/prisma/enums";

/** Piezas visuales del sitio comercial. */

/**
 * Ancla de sección.
 *
 * En la landing apunta a `#seccion`, que hace scroll dentro de la misma página.
 * Desde una página de detalle tiene que ser `/#seccion`, o el navegador buscaría
 * una sección que ahí no existe. Se resuelve con un parámetro en vez de duplicar
 * la cabecera, para que las dos versiones no se separen con el tiempo.
 */
function anchor(id: string, home: boolean): string {
  return home ? `#${id}` : `/#${id}`;
}

/**
 * Cabecera del sitio comercial.
 *
 * Los colores (texto, borde, logo, switch) siguen los mismos tokens de tema
 * en el home que en cualquier otra página — nunca un valor fijo a "blanco
 * porque flota sobre una foto oscura". Eso era válido cuando el hero era
 * siempre oscuro; ahora que tiene un tratamiento claro real, forzar blanco
 * dejaría el texto invisible sobre el overlay claro. Lo único que `home`
 * seguye decidiendo es la opacidad de fondo: transparente flotando sobre el
 * hero, más sólida en el resto de páginas.
 */
export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header
      className={cx(
        "sticky top-0 z-20 border-b border-border backdrop-blur-xl",
        home ? "bg-background/55" : "bg-surface/75",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
        <Link href="/" aria-label="Ir al inicio">
          <HeaderLogo />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={anchor("como-funciona", home)}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground md:block"
          >
            Cómo funciona
          </a>
          <a
            href={anchor("soluciones", home)}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground lg:block"
          >
            Soluciones
          </a>
          <a
            href={anchor("industrias", home)}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground lg:block"
          >
            Para negocios
          </a>
          <Link
            href="/precios"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground md:block"
          >
            Precios
          </Link>
          {/*
            En pantallas angostas el botón del hero ya cubre el contacto, así
            que acá se prioriza el acceso al panel.

            Se oculta con un contenedor y no con una clase en el botón: este ya
            trae `inline-flex`, y entre dos utilidades de display gana la que
            Tailwind emita última en el CSS, no la última que se escriba.
          */}
          <span className="hidden sm:inline-flex">
            <LinkButton href={anchor("contacto", home)} variant="primary">
              Quiero mi TapGo
            </LinkButton>
          </span>
          <CrossOriginLinkButton href="/login" variant="ghost">
            Ingresar
          </CrossOriginLinkButton>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/**
 * CTA fijo al pie de la pantalla, solo en mobile.
 *
 * Vive junto al footer a propósito: `SiteFooter` solo se usa en las páginas
 * de marketing (nunca en `/registro`, `/login`, `/app` ni `/client`), así que
 * esto nunca tapa un formulario ni un panel — aparece exactamente donde tiene
 * sentido un empujón final hacia la conversión.
 */
function MobileStickyCta({ home }: { home: boolean }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <LinkButton href={anchor("contacto", home)} variant="primary" className="w-full justify-center">
        Quiero mi TapGo
      </LinkButton>
    </div>
  );
}

/** Pie del sitio comercial. */
export function SiteFooter({ home = false }: { home?: boolean }) {
  return (
    <>
      <MobileStickyCta home={home} />
      <footer className="on-dark">
      {/* `pb-28` en mobile deja lugar para que el CTA fijo no tape estos enlaces. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 pt-14 pb-28 text-sm text-muted sm:pb-14">
        <div>
          <Link href="/" aria-label="Ir al inicio">
            <BrandWordmark />
          </Link>
          <p className="mt-3 max-w-xs">
            NFC, QR y presencia digital para negocios en Costa Rica.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <a href={anchor("como-funciona", home)} className="hover:text-foreground">
            Cómo funciona
          </a>
          <a href={anchor("soluciones", home)} className="hover:text-foreground">
            Soluciones
          </a>
          <a href={anchor("paquetes", home)} className="hover:text-foreground">
            Paquetes
          </a>
          <Link href="/precios" className="hover:text-foreground">
            Precios
          </Link>
          <a href={anchor("faq", home)} className="hover:text-foreground">
            FAQ
          </a>
          <a href={anchor("contacto", home)} className="hover:text-foreground">
            Contacto
          </a>
          <Link href="/nosotros" className="hover:text-foreground">
            Nosotros
          </Link>
          {/*
            <a> a propósito, no <Link>: nginx redirige /registro y /login del
            dominio raíz hacia app.{dominio}, y el <Link> de Next intentaría
            precargarlos con un fetch cross-origin que el navegador bloquea
            por CORS. Un <a> dispara una navegación completa normal.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/registro" className="hover:text-foreground">
            Crear cuenta
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/login" className="hover:text-foreground">
            Ingresar
          </a>
          <Link href="/privacidad" className="hover:text-foreground">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-foreground">
            Términos
          </Link>
        </nav>
      </div>
    </footer>
    </>
  );
}

/** Barra de lectura fija en el borde superior. */
export function ScrollProgress() {
  return <div aria-hidden="true" className="scroll-progress" />;
}

/**
 * Manchas de color difuminadas que dan profundidad al fondo.
 *
 * El parallax va en un contenedor aparte: las manchas ya animan su propio
 * `transform` con la deriva, y dos animaciones sobre la misma propiedad del
 * mismo elemento se pisan entre sí.
 */
export function Blobs({ parallax = false }: { parallax?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className={cx("absolute inset-0", parallax && "parallax")}>
        <div className="blob absolute -top-32 -left-24 size-[22rem] rounded-full bg-brand/25 blur-3xl sm:size-[30rem]" />
        <div
          className="blob absolute top-32 -right-28 size-[20rem] rounded-full bg-brand-400/20 blur-3xl sm:size-[26rem]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="blob absolute -bottom-40 left-1/3 size-[18rem] rounded-full bg-brand/15 blur-3xl sm:size-[24rem]"
          style={{ animationDelay: "-12s" }}
        />
      </div>
    </div>
  );
}

/** Encabezado de sección: etiqueta pequeña, título grande y bajada opcional. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={cx("reveal", centered && "mx-auto max-w-3xl text-center")}>
      <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand uppercase">
        <span className="h-px w-6 bg-brand" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base text-muted text-pretty sm:mt-5 sm:text-lg lg:text-xl">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Paso numerado del "cómo funciona". */
export function Step({
  number,
  title,
  children,
  delay,
}: {
  number: number;
  title: string;
  children: ReactNode;
  delay?: 2 | 3 | 4;
}) {
  return (
    <li
      className={cx(
        "reveal lift relative flex flex-col rounded-2xl border border-border bg-surface p-7",
        delay && `reveal-${delay}`,
      )}
    >
      {/*
        El número va en el acento cálido y no en el de marca: es lo que ordena
        la lectura de la sección, y en una página enteramente teal el contraste
        de tono hace que se lea antes que el título.
      */}
      <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-lg font-semibold text-accent-contrast shadow-lg shadow-accent/30">
        {number}
      </span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </li>
  );
}

/**
 * Tarjeta de un paquete comercial.
 *
 * Toda la tarjeta es un enlace al desglose. Se envuelve el `<li>` completo y no
 * solo el título porque en un teléfono el objetivo tiene que ser grande: nadie
 * apunta a tres palabras con el pulgar.
 */
export function PackageCard({
  slug,
  level,
  name,
  includes,
  featured = false,
}: {
  slug: string;
  level: number;
  name: string;
  includes: string[];
  featured?: boolean;
}) {
  return (
    <li
      className={cx(
        "reveal lift relative flex flex-col rounded-2xl bg-surface p-7",
        featured
          ? "border-2 border-accent shadow-2xl shadow-accent/20"
          : "border border-border",
      )}
    >
      {featured ? (
        <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-[10px] font-semibold tracking-widest text-accent-contrast uppercase">
          Todo incluido
        </span>
      ) : null}

      <p className="text-xs font-semibold tracking-widest text-muted uppercase">
        Paquete {level}
      </p>

      <h3 className="mt-2 text-xl font-semibold">
        {/*
          El enlace se estira sobre toda la tarjeta con un pseudo-elemento. Así
          el área táctil es la tarjeta entera, pero en el árbol de accesibilidad
          sigue habiendo un solo enlace con un nombre claro, en lugar de un
          bloque envuelto donde el lector de pantalla anuncia todo el contenido.
        */}
        <Link
          href={`/paquetes/${slug}`}
          className="after:absolute after:inset-0 after:content-[''] hover:text-brand"
        >
          {name}
        </Link>
      </h3>

      <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <span className="mt-6 text-sm font-medium text-brand">
        Ver el desglose <span aria-hidden="true">&rsaquo;</span>
      </span>
    </li>
  );
}

export function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0 text-brand"
      aria-hidden="true"
    >
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  );
}

/**
 * Cinta en movimiento continuo.
 *
 * La lista se duplica para que el bucle no tenga costura; la copia queda oculta
 * a los lectores de pantalla para no leer todo dos veces. Si la persona pidió
 * menos movimiento, la cinta se queda quieta y sigue siendo legible.
 */
function MarqueeShell({
  reverse,
  children,
}: {
  reverse?: boolean;
  children: (copy: number) => ReactNode;
}) {
  return (
    <div className="marquee-shell relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      <div className={cx("marquee-track flex w-max", reverse && "marquee-reverse")}>
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex shrink-0">
            {children(copy)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cinta de etiquetas de texto.
 *
 * `plain` quita el borde, el fondo y el radio de cada etiqueta y las separa con
 * un punto medio, en lugar de dibujar un "pill" por cada una. Existe porque, en
 * reposo —sin animación, sea por `prefers-reduced-motion` o porque el
 * navegador no soporta el desplazamiento nativo—, una fila de pills partida en
 * dos bloques independientes se lee como dos hileras de botones sueltas y no
 * como una sola cinta. En texto plano, la misma composición se sostiene
 * también cuando no se mueve: los ejemplos "TikTok, WhatsApp, Instagram…" se
 * leen como una frase continua, no como una fila de UI rota.
 */
export function Marquee({
  items,
  reverse,
  plain = false,
}: {
  items: string[];
  reverse?: boolean;
  plain?: boolean;
}) {
  return (
    <MarqueeShell reverse={reverse}>
      {() => (
        <ul
          className={cx(
            "flex items-center",
            plain ? "gap-3 pr-3 sm:gap-4 sm:pr-4" : "gap-2.5 pr-2.5 sm:gap-3 sm:pr-3",
          )}
        >
          {items.map((item, index) => (
            <li key={item} className="flex items-center gap-3 sm:gap-4">
              <span
                className={cx(
                  "whitespace-nowrap",
                  plain
                    ? "text-base font-medium sm:text-lg"
                    : "rounded-full border border-border bg-surface px-4 py-2 text-sm sm:px-6 sm:py-2.5",
                )}
              >
                {item}
              </span>
              {/* El punto separador no va después del último: cerraría la
                  frase con un punto suelto antes de que la copia se repita. */}
              {plain && index < items.length - 1 ? (
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </MarqueeShell>
  );
}

/** Cinta de los destinos que puede tener una landing, con su ícono. */
export function IconMarquee({
  items,
  reverse,
}: {
  items: Array<{ type: LinkType; label: string }>;
  reverse?: boolean;
}) {
  return (
    <MarqueeShell reverse={reverse}>
      {() => (
        <ul className="flex items-center gap-6 pr-6 sm:gap-10 sm:pr-10">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 text-base font-medium whitespace-nowrap sm:gap-3 sm:text-lg"
            >
              <span className="text-brand">
                <LinkIcon type={item.type} className="size-5 sm:size-6" />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </MarqueeShell>
  );
}

/** Dato corto y verificable de la banda bajo el hero. */
export function Highlight({
  title,
  children,
  delay,
}: {
  title: string;
  children: ReactNode;
  delay?: 2 | 3 | 4;
}) {
  return (
    <div className={cx("reveal", delay && `reveal-${delay}`)}>
      <p className="text-3xl font-semibold text-brand">{title}</p>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </div>
  );
}
