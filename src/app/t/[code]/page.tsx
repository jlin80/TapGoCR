import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { BusinessAvatar, BusinessCover, InactiveTag } from "@/components/landing";
import { LinkIcon } from "@/components/link-icon";
import { EventSource, LinkType, MenuMode, ScanEventType } from "@/generated/prisma/enums";
import { appName, showBranding, tagUrl } from "@/lib/config";
import { galleryFor } from "@/lib/gallery";
import { isPlausibleCode, landingButtons, splitButtons } from "@/lib/landing";
import { hasPublishedMenu, publicFeaturedItems } from "@/lib/menu";
import { formatPrice } from "@/lib/price";
import { prisma } from "@/lib/prisma";
import { themeClasses, landingThemeStyle } from "@/lib/theme";
import { recordEvent } from "@/lib/tracking";

// Cada visita se registra, así que la página no puede servirse desde caché.
export const dynamic = "force-dynamic";

async function loadTag(code: string) {
  if (!isPlausibleCode(code)) return null;

  return prisma.tag.findUnique({
    where: { code },
    select: {
      id: true,
      active: true,
      business: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          logoUrl: true,
          coverUrl: true,
          brandColor: true,
          accentColor: true,
          landingTheme: true,
          menuMode: true,
          phone: true,
          whatsapp: true,
          address: true,
          latitude: true,
          longitude: true,
          websiteUrl: true,
          active: true,
          links: {
            where: { active: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: { id: true, type: true, label: true },
          },
        },
      },
    },
  });
}

/**
 * Metadata para la vista previa al compartir el enlace.
 *
 * El `noindex` se mantiene: las URLs de tag se reparten por NFC y QR, no tiene
 * sentido que un buscador las indexe y evita exponer el catálogo de códigos.
 * Open Graph es otra cosa —lo leen WhatsApp, Facebook y Telegram al pegar el
 * enlace, no los buscadores—, así que ambas cosas conviven sin contradicción.
 */
export async function generateMetadata({
  params,
}: PageProps<"/t/[code]">): Promise<Metadata> {
  const { code } = await params;
  const tag = await loadTag(code);
  const business = tag?.business;
  const visible = business && tag?.active && business.active;

  if (!visible) {
    return { title: appName, robots: { index: false, follow: false } };
  }

  const description =
    business.description ?? business.category ?? `Encontrá a ${business.name}.`;

  return {
    title: business.name,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: business.name,
      description,
      siteName: appName,
      url: tagUrl(code),
      // La portada manda sobre el logo: es la imagen pensada para ocupar ancho.
      images: coverImage(business.coverUrl ?? business.logoUrl, business.name),
    },
    twitter: {
      card: business.coverUrl ? "summary_large_image" : "summary",
      title: business.name,
      description,
    },
  };
}

function coverImage(url: string | null, alt: string) {
  return url ? [{ url, alt }] : undefined;
}

/**
 * Origen de la visita. El QR impreso apunta a la URL con `?s=qr`; el NFC lleva
 * la URL limpia. Cualquier otro valor se trata como tap.
 */
function sourceFrom(value: string | string[] | undefined): EventSource {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "qr" ? EventSource.QR : EventSource.TAP;
}

/** Texto del CTA principal según la categoría del negocio. Sin categoría, "Ver menú" es el default más seguro. */
function menuCtaLabel(category: string | null): string {
  const normalized = (category ?? "").toLowerCase();
  if (/(hotel|hospedaje|hostal)/.test(normalized)) return "Ver servicios";
  if (/(tour|experiencia|excursi[oó]n)/.test(normalized)) return "Ver experiencias";
  return "Ver menú";
}

export default async function TagLandingPage({
  params,
  searchParams,
}: PageProps<"/t/[code]">) {
  const { code } = await params;
  const source = sourceFrom((await searchParams).s);
  const tag = await loadTag(code);

  if (!tag) notFound();

  const business = tag.business;

  if (!tag.active || !business.active) {
    return <InactiveTag />;
  }

  const requestHeaders = await headers();
  await recordEvent({
    businessId: business.id,
    tagId: tag.id,
    eventType: ScanEventType.SCAN,
    source,
    headers: requestHeaders,
  });

  // El botón del menú nativo solo aparece si el negocio eligió ese modo y de
  // verdad hay algo publicado. Un menú vacío deja al cliente final en una
  // página en blanco, que es peor que no ofrecer el botón; y mientras no haya
  // carta cargada, el enlace o PDF anterior sigue funcionando.
  const nativeMenu =
    business.menuMode === MenuMode.NATIVE && (await hasPublishedMenu(business.id));

  const featured = nativeMenu ? await publicFeaturedItems(business.id) : [];
  const gallery = await galleryFor(business.id);

  const allButtons = landingButtons(business, { nativeMenuActive: nativeMenu });
  const { quickActions, secondary } = splitButtons(allButtons);

  const qs = source === EventSource.QR ? "?s=qr" : "";
  const theme = themeClasses(business.landingTheme);

  return (
    <main
      style={landingThemeStyle(business.landingTheme, business.brandColor, business.accentColor)}
      className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col px-5 pb-10"
    >
      <BusinessCover url={business.coverUrl} name={business.name} />

      <header
        className={`animate-landing-in flex flex-col items-center text-center ${
          business.coverUrl ? "-mt-12" : "pt-10"
        }`}
      >
        <BusinessAvatar name={business.name} logoUrl={business.logoUrl} />
        <h1 className={`mt-4 text-[1.75rem] leading-tight text-balance ${theme.heading}`}>
          {business.name}
        </h1>
        {business.category ? (
          <p className={`mt-1.5 text-[0.7rem] text-brand ${theme.eyebrow}`}>
            {business.category}
          </p>
        ) : null}
        {business.description ? (
          <p className="mt-2.5 max-w-xs text-sm text-muted text-pretty">
            {business.description}
          </p>
        ) : null}
        {business.address ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-3.5 shrink-0 text-brand"
            >
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            </svg>
            {business.address}
          </p>
        ) : null}
      </header>

      {quickActions.length > 0 ? (
        <div
          className="animate-landing-in animate-landing-in-delay-1 mt-6 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Acciones rápidas"
        >
          {quickActions.map((button) => (
            <a
              key={button.id}
              href={`/t/${encodeURIComponent(code)}/go/${encodeURIComponent(button.id)}${qs}`}
              rel="noopener noreferrer"
              className="tap-target flex shrink-0 flex-col items-center gap-1.5 rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-center transition-transform active:scale-95"
            >
              <LinkIcon type={button.type} className="size-5 text-brand" />
              <span className="text-[0.65rem] leading-none font-medium text-muted">
                {quickActionShortLabel(button.type, button.label)}
              </span>
            </a>
          ))}
        </div>
      ) : null}

      {nativeMenu ? (
        <a
          href={`/t/${encodeURIComponent(code)}/menu${qs}`}
          className="animate-landing-in animate-landing-in-delay-2 tap-target mt-4 flex min-h-16 items-center justify-between rounded-[var(--radius)] bg-brand px-5 text-brand-contrast shadow-lg shadow-brand/20 transition-transform active:scale-[0.98]"
        >
          <span className="text-base font-semibold">{menuCtaLabel(business.category)}</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </a>
      ) : null}

      {featured.length > 0 ? (
        <section className="animate-landing-in animate-landing-in-delay-2 mt-8">
          <h2 className={`text-sm text-muted ${theme.eyebrow}`}>Destacados</h2>
          <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((item) => {
              const price = formatPrice(item.priceCents);
              return (
                <div
                  key={item.id}
                  className="w-[13.5rem] shrink-0 overflow-hidden rounded-[var(--radius)] border border-border bg-surface"
                >
                  <div className="aspect-[4/3] bg-surface-muted">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-3xl font-semibold text-brand/40">
                        {item.name.trim()[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {item.description}
                      </p>
                    ) : null}
                    {price ? (
                      <p className="mt-1.5 text-sm font-semibold text-brand">{price}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="animate-landing-in animate-landing-in-delay-2 mt-8">
          <h2 className={`text-sm text-muted ${theme.eyebrow}`}>Seguinos</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {gallery.map((post) => {
              const image = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              );

              return (
                <div
                  key={post.id}
                  className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-surface-muted"
                >
                  {post.linkUrl ? (
                    <a
                      href={post.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block size-full transition-transform active:scale-95"
                    >
                      {image}
                    </a>
                  ) : (
                    image
                  )}
                  {post.platform ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/40 text-white"
                    >
                      <LinkIcon type={post.platform} className="size-3" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {secondary.length > 0 ? (
        <nav
          className="animate-landing-in animate-landing-in-delay-2 mt-8 flex flex-col gap-2.5"
          aria-label="Más enlaces"
        >
          {secondary.map((button) => (
            <LandingLink
              key={button.id}
              // Reseñas es la única categoría que no va directo al destino: pasa
              // primero por el feedback interno (ver `/t/[code]/feedback`), que
              // arma su propio enlace hacia Google a partir de este mismo botón.
              href={
                button.type === LinkType.GOOGLE_REVIEWS
                  ? `/t/${encodeURIComponent(code)}/feedback${qs}`
                  : `/t/${encodeURIComponent(code)}/go/${encodeURIComponent(button.id)}${qs}`
              }
              type={button.type}
              label={button.label}
            />
          ))}
        </nav>
      ) : null}

      {!nativeMenu && quickActions.length === 0 && secondary.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius)] border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          Este negocio todavía no tiene enlaces publicados.
        </p>
      ) : null}

      {showBranding ? (
        <footer className="mt-auto pt-10 text-center text-[0.7rem] text-muted">
          Powered by {appName}
        </footer>
      ) : null}
    </main>
  );
}

/** Etiqueta corta para el chip de acción rápida: el texto configurado puede ser largo ("Escribinos por WhatsApp"), acá va compacto. */
function quickActionShortLabel(type: LinkType, label: string): string {
  const SHORT: Partial<Record<LinkType, string>> = {
    WHATSAPP: "WhatsApp",
    PHONE: "Llamar",
    GOOGLE_MAPS: "Cómo llegar",
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    TIKTOK: "TikTok",
  };
  return SHORT[type] ?? label;
}

/** Botón de la landing. Alto mínimo de 56 px, cómodo para el pulgar. */
function LandingLink({
  href,
  type,
  label,
}: {
  href: string;
  type: LinkType;
  label: string;
}) {
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      className="tap-target group flex min-h-14 items-center gap-3.5 rounded-[var(--radius)] border border-border bg-surface px-4 py-3 text-base font-medium transition-transform active:scale-[0.98]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <LinkIcon type={type} className="size-[1.15rem]" />
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span aria-hidden="true" className="text-muted">
        &rsaquo;
      </span>
    </a>
  );
}
