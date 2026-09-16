import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessAvatar } from "@/components/landing";
import { EventSource, MenuMode, ScanEventType } from "@/generated/prisma/enums";
import { appName, showBranding } from "@/lib/config";
import { isPlausibleCode, MENU_NATIVE_TARGET } from "@/lib/landing";
import { publicMenu } from "@/lib/menu";
import { formatPrice } from "@/lib/price";
import { prisma } from "@/lib/prisma";
import { landingThemeStyle, themeClasses } from "@/lib/theme";
import { recordEvent } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Menú digital nativo de un negocio.
 *
 * Se llega desde el botón "Ver menú" de la landing cuando el negocio eligió el
 * modo NATIVE. La visita se registra como CLICK con destino `MENU_NATIVE`, no
 * como SCAN: la persona ya fue contada al abrir la landing y volver a contarla
 * duplicaría los taps y consumiría cuota de chip por una navegación interna.
 */
export default async function TagMenuPage({
  params,
  searchParams,
}: PageProps<"/t/[code]/menu">) {
  const { code } = await params;
  const raw = (await searchParams).s;
  const source =
    (Array.isArray(raw) ? raw[0] : raw) === "qr" ? EventSource.QR : EventSource.TAP;

  if (!isPlausibleCode(code)) notFound();

  const tag = await prisma.tag.findUnique({
    where: { code },
    select: {
      id: true,
      active: true,
      business: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          active: true,
          menuMode: true,
          brandColor: true,
          accentColor: true,
          landingTheme: true,
        },
      },
    },
  });

  // Un tag inactivo, un negocio apagado o un negocio en modo LINK no tienen
  // menú nativo que mostrar. Los tres casos devuelven 404 y no un mensaje
  // distinto para cada uno: no hay motivo para revelar cuál se dio.
  if (
    !tag ||
    !tag.active ||
    !tag.business.active ||
    tag.business.menuMode !== MenuMode.NATIVE
  ) {
    notFound();
  }

  const categories = await publicMenu(tag.business.id);
  if (categories.length === 0) notFound();

  await recordEvent({
    businessId: tag.business.id,
    tagId: tag.id,
    eventType: ScanEventType.CLICK,
    target: MENU_NATIVE_TARGET,
    source,
    headers: await headers(),
  });

  const theme = themeClasses(tag.business.landingTheme);

  return (
    <main
      style={landingThemeStyle(
        tag.business.landingTheme,
        tag.business.brandColor,
        tag.business.accentColor,
      )}
      className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col pb-10"
    >
      <div className="flex flex-col px-5 pt-6">
        {/*
          El logo y el nombre del negocio llevan de vuelta a su landing: es el
          "inicio" de este negocio, igual que el logo de cualquier sitio.
        */}
        <Link
          href={`/t/${encodeURIComponent(code)}`}
          className="tap-target -ml-1 mb-5 inline-flex items-center gap-1.5 self-start rounded-full py-1 pr-2 text-sm font-medium text-muted"
        >
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
            <path d="M12.5 5 7 10l5.5 5" />
          </svg>
          {tag.business.name}
        </Link>

        <div className="flex items-center gap-3">
          <BusinessAvatar name={tag.business.name} logoUrl={tag.business.logoUrl} size="size-11" />
          <div>
            <h1 className={`text-2xl leading-tight ${theme.heading}`}>Menú</h1>
            <p className="text-sm text-muted">{tag.business.name}</p>
          </div>
        </div>
      </div>

      {categories.length > 1 ? (
        <nav
          aria-label="Categorías"
          className="mt-6 flex gap-2 overflow-x-auto border-b border-border px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              className="tap-target shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-muted transition-colors active:border-brand/50 active:text-brand"
            >
              {category.name}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 flex flex-col gap-10 px-5">
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-24">
            <div className="flex items-baseline gap-2.5">
              <span aria-hidden="true" className="h-5 w-1 shrink-0 rounded-full bg-brand" />
              <h2 className={`text-lg ${theme.heading}`}>{category.name}</h2>
              <span className="text-xs text-muted">
                {category.items.length}{" "}
                {category.items.length === 1 ? "producto" : "productos"}
              </span>
            </div>
            {category.description ? (
              <p className="mt-1 pl-3.5 text-sm text-muted">{category.description}</p>
            ) : null}

            <ul className="mt-4 flex flex-col gap-3">
              {category.items.map((item) => {
                const price = formatPrice(item.priceCents);
                const initial = item.name.trim()[0]?.toUpperCase() ?? "?";

                return (
                  <li
                    key={item.id}
                    className="relative flex items-center gap-3.5 overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-3"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        width={72}
                        height={72}
                        loading="lazy"
                        decoding="async"
                        className="size-[4.5rem] shrink-0 rounded-[calc(var(--radius)_-_0.4rem)] bg-surface-muted object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-[calc(var(--radius)_-_0.4rem)] bg-brand/10 text-xl font-semibold text-brand"
                      >
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium">{item.name}</p>
                        {item.featured ? (
                          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-brand uppercase">
                            Favorito
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    {price ? (
                      <p className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-brand">
                        {price}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {showBranding ? (
        <footer className="mt-auto px-5 pt-10 text-center text-[0.7rem] text-muted">
          Powered by {appName}
        </footer>
      ) : null}
    </main>
  );
}
