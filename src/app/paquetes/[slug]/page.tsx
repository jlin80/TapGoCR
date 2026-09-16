import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";
import { packageBySlug, PACKAGES } from "@/lib/packages";

/**
 * Desglose de un paquete.
 *
 * La tarjeta de la landing solo alcanza para tres líneas; acá va lo que
 * realmente se entrega, para quién tiene sentido y —sobre todo— qué NO incluye.
 * Decir de frente dónde termina cada paquete evita la conversación incómoda
 * después de vender.
 *
 * Es contenido fijo, así que se prerrenderiza: son las únicas páginas del
 * proyecto, junto con la landing, pensadas para que las indexe un buscador.
 */
export function generateStaticParams() {
  return PACKAGES.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/paquetes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = packageBySlug(slug);

  if (!item) return { title: "Paquete no encontrado" };

  return {
    title: `${item.name} · Paquete ${item.level}`,
    description: item.tagline,
    alternates: { canonical: `/paquetes/${item.slug}` },
    openGraph: {
      title: `${item.name} — ${appName}`,
      description: item.tagline,
      type: "website",
    },
  };
}

export default async function PackageDetailPage({
  params,
}: PageProps<"/paquetes/[slug]">) {
  const { slug } = await params;
  const item = packageBySlug(slug);

  if (!item) notFound();

  const previous = PACKAGES.find((p) => p.level === item.level - 1);
  const next = PACKAGES.find((p) => p.level === item.level + 1);

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <Link
              href="/#paquetes"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <span aria-hidden="true">&lsaquo;</span> Todos los paquetes
            </Link>

            <p className="mt-8 text-xs font-semibold tracking-widest text-muted uppercase">
              Paquete {item.level}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-5xl">
              {item.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{item.tagline}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
              <a
                href="/registro"
                className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
              >
                Pedir una propuesta
              </a>
              <Link
                href="/#contacto"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 font-medium transition-colors hover:bg-surface-muted"
              >
                Hacer una consulta
              </Link>
            </div>

            {/*
              Sin precio publicado a propósito: depende de cuántas placas lleva
              el local. Se dice acá en lugar de dejar el vacío sin explicar.
            */}
            <p className="mt-5 text-sm text-muted">
              El precio depende de cuántas placas necesita tu local. Contanos de tu
              negocio y te armamos una propuesta concreta.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Qué incluye</h2>

          <ul className="mt-8 flex flex-col gap-5">
            {item.entrega.map((bloque) => (
              <li
                key={bloque.title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-semibold">{bloque.title}</h3>
                <p className="mt-2 text-muted">{bloque.description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold">Para quién es</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {item.idealPara.map((linea) => (
                  <li key={linea} className="flex gap-2.5 text-sm">
                    <span aria-hidden="true" className="mt-0.5 text-brand">
                      ✓
                    </span>
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface-muted p-6">
              <h2 className="text-lg font-semibold">Qué no incluye</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {item.noIncluye.map((linea) => (
                  <li key={linea} className="flex gap-2.5 text-sm text-muted">
                    <span aria-hidden="true" className="mt-0.5">
                      —
                    </span>
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navegación entre paquetes: se comparan mucho antes de decidir. */}
          <nav
            aria-label="Otros paquetes"
            className="mt-12 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between"
          >
            {previous ? (
              <Link
                href={`/paquetes/${previous.slug}`}
                className="group rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-brand"
              >
                <span className="block text-xs tracking-widest text-muted uppercase">
                  Paquete {previous.level}
                </span>
                <span className="mt-1 block font-medium group-hover:text-brand">
                  &lsaquo; {previous.name}
                </span>
              </Link>
            ) : (
              <span />
            )}

            {next ? (
              <Link
                href={`/paquetes/${next.slug}`}
                className="group rounded-xl border border-border bg-surface px-5 py-4 text-right transition-colors hover:border-brand"
              >
                <span className="block text-xs tracking-widest text-muted uppercase">
                  Paquete {next.level}
                </span>
                <span className="mt-1 block font-medium group-hover:text-brand">
                  {next.name} &rsaquo;
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
