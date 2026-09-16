import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkIcon } from "@/components/link-icon";
import { Check, SectionHeading, SiteFooter, SiteHeader } from "@/components/marketing";
import { appName, contactWhatsappUrl } from "@/lib/config";
import { industryBySlug, INDUSTRIES } from "@/lib/industries";
import { LINK_TYPE_LABELS } from "@/lib/link-types";

/**
 * Landing por rubro (/restaurantes, /barberias, …).
 *
 * Es el mismo producto que la landing principal, con copy y un orden de
 * botones sugerido distintos por rubro — no seis productos diferentes. El
 * contenido vive en `src/lib/industries.ts`; agregar un rubro nuevo es
 * agregar una entrada ahí, no duplicar esta página.
 *
 * Contenido fijo, así que se prerrenderiza como el resto del sitio comercial.
 */
export function generateStaticParams() {
  return INDUSTRIES.map((item) => ({ industry: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[industry]">): Promise<Metadata> {
  const { industry: slug } = await params;
  const industry = industryBySlug(slug);

  if (!industry) return { title: "Página no encontrada" };

  // "Costa Rica" va en el metadata (lo que lee el buscador), no en el tagline
  // que se muestra en pantalla: ahí ya alcanza con el contexto de la página.
  const title = `${appName} para ${industry.article} en Costa Rica`;
  const description = `${industry.tagline} NFC y QR para ${industry.article} en Costa Rica.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/${industry.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function IndustryPage({ params }: PageProps<"/[industry]">) {
  const { industry: slug } = await params;
  const industry = industryBySlug(slug);

  if (!industry) notFound();

  const others = INDUSTRIES.filter((item) => item.slug !== industry.slug);

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero -------------------------------------------------------- */}
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              {industry.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-5xl">
              {industry.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{industry.tagline}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
              <a
                href="/registro"
                className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
              >
                Registrá tu negocio
              </a>
              {contactWhatsappUrl ? (
                <a
                  href={contactWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 font-medium transition-colors hover:bg-surface-muted"
                >
                  Consultar por WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* Problema / Solución ------------------------------------------ */}
        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold">El problema de siempre</h2>
              <p className="mt-3 text-muted">{industry.problema}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Cómo lo resuelve TapGoCR</h2>
              <p className="mt-3 text-muted">{industry.solucion}</p>
            </div>
          </div>

          {/* Flujo sugerido de botones ------------------------------------ */}
          <div className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">
              Orden sugerido para {industry.article}
            </p>
            <ol className="mt-4 flex flex-wrap items-center gap-3">
              {industry.flujo.map((type, index) => (
                <li key={type} className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-2 text-sm font-medium">
                    <span className="text-brand">
                      <LinkIcon type={type} className="size-4" />
                    </span>
                    {LINK_TYPE_LABELS[type]}
                  </span>
                  {index < industry.flujo.length - 1 ? (
                    <span aria-hidden="true" className="text-muted">
                      &rsaquo;
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted">
              Es solo una sugerencia de orden: agregás, quitás o reordenás botones
              cuando quieras desde tu panel.
            </p>
          </div>
        </section>

        {/* Beneficios ----------------------------------------------------- */}
        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <SectionHeading
              eyebrow="Beneficios"
              title={`Por qué le sirve a ${industry.article}`}
              centered={false}
            />
            <ul className="mt-8 flex flex-col gap-4">
              {industry.beneficios.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Analytics -------------------------------------------------- */}
        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <SectionHeading
            eyebrow="Analytics"
            title="Sabés qué botón usan de verdad"
            description="Escaneos y clics por botón y por placa, con cifras que descartan bots y recargas repetidas. Nada de números inflados."
            centered={false}
          />
        </section>

        {/* Precios ------------------------------------------------------ */}
        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:py-20">
            <SectionHeading
              eyebrow="Precios"
              title="Pagás por placas, no por escaneos"
              description="Los taps son siempre ilimitados. Mirá los planes y elegí según cuántas placas necesita tu local."
            />
            <Link
              href="/precios"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
            >
              Ver precios
            </Link>
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------ */}
        <section className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <SectionHeading eyebrow="Preguntas" title="Dudas frecuentes" />
          <div className="mt-10 flex flex-col gap-6">
            {industry.faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final -------------------------------------------------- */}
        <section className="on-dark">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Empezá con tu primera placa
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Contanos de tu negocio y te armamos una propuesta concreta para{" "}
              {industry.article}.
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
            <a
              href="/registro"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3.5 font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
            >
              Registrá tu negocio
            </a>
          </div>
        </section>

        {/* Otros rubros ------------------------------------------------- */}
        <nav
          aria-label="Otros rubros"
          className="mx-auto max-w-4xl px-5 py-10 text-center text-sm"
        >
          <p className="text-muted">También armamos guías para:</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-3">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/${item.slug}`}
                  className="inline-flex rounded-full border border-border px-4 py-1.5 font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <SiteFooter />
    </>
  );
}
