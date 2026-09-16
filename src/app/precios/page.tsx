import type { Metadata } from "next";
import Link from "next/link";

import { Check, SiteFooter, SiteHeader } from "@/components/marketing";
import { cx, LinkButton } from "@/components/ui";
import { appName } from "@/lib/config";
import { COMPARISON_ROWS, ONE_TIME_OPTION, PLANS } from "@/lib/offers";

export const metadata: Metadata = {
  title: `Precios · ${appName}`,
  description:
    "Placas NFC + QR para negocios en Costa Rica desde ₡9.900, con plataforma, analytics y soporte desde ₡1.990/mes. Empezá con un punto TapGo y agregá más cuando crezcas.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/precios" },
  openGraph: {
    title: `Precios · ${appName}`,
    description:
      "Pagás una vez por tu placa NFC + QR y una mensualidad por la plataforma. Empezá desde ₡9.900.",
    type: "website",
  },
};

const FAQ_PRECIOS: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué incluye el pago inicial?",
    a: "El pago inicial cubre tu placa TapGo, el chip NFC, el código QR y la configuración inicial de tu solución.",
  },
  {
    q: "¿Qué cubre la mensualidad?",
    a: "La mensualidad mantiene activa tu plataforma TapGoCR: hosting, dashboard, analytics, actualizaciones y el soporte correspondiente a tu plan.",
  },
  {
    q: "¿Puedo agregar más placas después?",
    a: "Sí. Podés agregar puntos TapGo adicionales cuando los necesités, sin tener que reemplazar las placas existentes.",
  },
  {
    q: "¿Qué pasa si necesito más de 8 placas?",
    a: "Podés agregar placas adicionales sobre el plan Pro, o pedirnos una propuesta a medida para múltiples puntos o sucursales.",
  },
  {
    q: "¿Puedo cambiar de plan?",
    a: "Sí. La estructura está pensada para que empieces con lo que necesitás hoy y amplíes tu solución conforme crece tu negocio.",
  },
  {
    q: "¿Tengo que cambiar la placa si cambio mi menú?",
    a: "No. La placa nunca guarda el contenido, solo apunta a tu página: actualizás el menú, el WhatsApp o cualquier enlace desde tu panel y se ve al instante, sin reprogramar ni reimprimir nada.",
  },
  {
    q: "¿Puedo usar NFC y QR?",
    a: "Sí. Cada punto TapGo combina NFC y QR en la misma placa, para que tus clientes accedan aunque su teléfono no tenga NFC.",
  },
  {
    q: "¿Hay límite de escaneos?",
    a: "No. Los escaneos y taps son siempre ilimitados; lo que varía entre planes es la cantidad de puntos TapGo (placas) incluidos.",
  },
  {
    q: "¿Qué pasa si cancelo?",
    a: "Tus placas dejan de mostrar tu página, pero podés reactivar cuando quieras: no perdés el historial mientras la cuenta siga existiendo. Escribinos para coordinar la baja.",
  },
];

export default function PreciosPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:py-20">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              Precios
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-5xl">
              Empezá pequeño. Crecé cuando lo necesités.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              Elegí la cantidad de puntos TapGo que necesitás hoy y agregá más cuando tu
              negocio crezca.
            </p>
          </div>
        </section>

        {/* Los tres planes. */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <ul className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <li
                key={plan.slug}
                className={cx(
                  "relative flex flex-col rounded-2xl bg-surface p-7",
                  plan.featured
                    ? "border-2 border-brand shadow-2xl shadow-brand/20"
                    : "border border-border",
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-[10px] font-semibold tracking-widest text-accent-contrast uppercase">
                    Más elegido
                  </span>
                ) : null}

                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted">{plan.idealFor}</p>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.initialPrice}
                  </span>
                </p>
                <p className="text-xs text-muted">Pago inicial · placa + configuración</p>

                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-brand">{plan.monthlyPrice}</span>
                  <span className="text-sm text-muted">/mes</span>
                </p>
                <p className="text-xs text-muted">Plataforma, analytics y soporte</p>

                <ul className="mt-6 flex flex-col gap-2.5 text-sm text-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
                <a
                  href="/registro"
                  className={cx(
                    "mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium transition-colors",
                    plan.featured
                      ? "bg-brand text-brand-contrast hover:bg-brand-strong"
                      : "border border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  {plan.cta}
                </a>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted">
            Empezá desde <strong className="font-semibold text-foreground">₡9.900</strong>.
            Incluye tu primera placa TapGo. Después, mantené tu plataforma desde{" "}
            <strong className="font-semibold text-foreground">₡1.990/mes</strong>. Precios en
            colones costarricenses.
          </p>
        </section>

        {/* Placas adicionales. */}
        <section className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <h2 className="text-2xl font-semibold text-balance sm:text-3xl">
              ¿Necesitás más puntos?
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Agregá puntos TapGo cuando tu negocio crezca. No necesitás cambiar de plan.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <li
                  key={plan.slug}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface p-6 text-center"
                >
                  <span className="text-sm font-medium text-muted">{plan.name}</span>
                  <span className="text-2xl font-semibold tracking-tight">
                    {plan.additionalPointPrice}
                  </span>
                  <span className="text-xs text-muted">placa adicional · pago único</span>
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted">
              El precio de la placa adicional corresponde al pago inicial: no suma una
              mensualidad extra.
            </p>
          </div>
        </section>

        {/* Comparación de planes — tabla en desktop, tarjetas apiladas en mobile. */}
        <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Comparar planes</h2>

          <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-border sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
                  <th className="px-4 py-3 font-medium text-muted">&nbsp;</th>
                  {PLANS.map((plan) => (
                    <th key={plan.slug} className="px-4 py-3 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted">{row.label}</td>
                    {PLANS.map((plan) => (
                      <td key={plan.slug} className="px-4 py-3">
                        <ComparisonValue value={row.values[plan.slug]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: una tarjeta por plan, cada una con todas las filas. */}
          <div className="mt-8 flex flex-col gap-6 sm:hidden">
            {PLANS.map((plan) => (
              <div key={plan.slug} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="font-semibold">{plan.name}</h3>
                <dl className="mt-3 flex flex-col gap-2.5">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-muted">{row.label}</dt>
                      <dd>
                        <ComparisonValue value={row.values[plan.slug]} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Opción de pago único, sin competir visualmente con los tres planes. */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
            <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-6 sm:p-8">
              <h2 className="text-lg font-semibold">¿No querés una mensualidad?</h2>
              <p className="mt-2 text-sm text-muted">
                También podés comenzar con una solución básica de pago único.
              </p>

              <p className="mt-4 text-2xl font-semibold tracking-tight">{ONE_TIME_OPTION.price}</p>
              <p className="text-xs text-muted">Pago único · sin mensualidad</p>

              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                {ONE_TIME_OPTION.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-muted">
                Esta modalidad tiene menos funciones que los planes con plataforma: sin
                analytics, sin dashboard y sin actualizaciones continuas.
              </p>

              <Link
                href="/#contacto"
                className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-muted"
              >
                {ONE_TIME_OPTION.cta}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ de precios. */}
        <section className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
            <h2 className="text-2xl font-semibold sm:text-3xl">Preguntas sobre precios</h2>
            <div className="mt-8 flex flex-col gap-5">
              {FAQ_PRECIOS.map((item) => (
                <div key={item.q} className="rounded-2xl border border-border bg-surface p-6">
                  <h3 className="font-semibold">{item.q}</h3>
                  <p className="mt-2 text-sm text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <p className="mx-auto max-w-2xl text-center text-sm text-muted">
            ¿Necesitás una propuesta a medida, con más placas o varias sucursales?{" "}
            <Link href="/#contacto" className="font-medium text-brand hover:underline">
              Conversemos
            </Link>
            .
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted">
            ¿Buscás qué se instala y se configura en cada nivel, más allá del precio?{" "}
            <Link href="/#paquetes" className="font-medium text-brand hover:underline">
              Mirá los paquetes
            </Link>
            .
          </p>

          <div className="mt-10 flex justify-center">
            <LinkButton href="/" variant="ghost">
              &lsaquo; Volver al inicio
            </LinkButton>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function ComparisonValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check />;
  if (value === false) return <span className="text-muted">—</span>;
  return <span>{value}</span>;
}
