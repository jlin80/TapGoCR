import type { Metadata } from "next";
import Link from "next/link";

import { Check, SiteFooter, SiteHeader } from "@/components/marketing";
import { cx, LinkButton } from "@/components/ui";
import { appName } from "@/lib/config";
import {
  ADDON_NFC_PRICE,
  ADDON_PLACA_PRICE,
  BUSINESS_COMING_SOON,
  BUSINESS_FEATURES,
  BUSINESS_PRICE,
  HARDWARE_TIERS,
  SMART_FEATURES,
  SMART_PRICE,
  TAPGO_FEATURES,
  TRIAL_DAYS,
} from "@/lib/offers";

export const metadata: Metadata = {
  title: `Precios · ${appName}`,
  description:
    "Comprá tu placa TapGo una sola vez, sin mensualidad obligatoria. Activá TapGo Smart o TapGo Business cuando quieras sumar analytics y control.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/precios" },
  openGraph: {
    title: `Precios · ${appName}`,
    description:
      "Tu placa es tuya. TapGo Smart y TapGo Business son suscripciones opcionales para sumar analytics, contenido dinámico y control.",
    type: "website",
  },
};

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
              Elegí cómo querés usar TapGo
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              Comprá tu placa una sola vez o llevála al siguiente nivel con
              TapGo Smart.
            </p>
          </div>
        </section>

        {/* Las tres formas de pagar: placa (pago único) y las dos suscripciones opcionales. */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <ul className="grid gap-6 lg:grid-cols-3">
            <li className="flex flex-col rounded-2xl border border-border bg-surface p-7">
              <h2 className="text-xl font-semibold">TapGo</h2>
              <p className="mt-1 text-sm text-muted">La placa, sin mensualidad.</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  Desde {HARDWARE_TIERS[0].price}
                </span>
              </p>
              <p className="mt-1 text-sm font-medium text-brand">Pago único</p>

              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-muted">
                {TAPGO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5">
                  <Check />
                  <span>Tu placa es tuya, para siempre</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check />
                  <span>Sin mensualidad obligatoria</span>
                </li>
              </ul>

              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
              <a
                href="/registro"
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-muted"
              >
                Comprar placa
              </a>
            </li>

            <li className="relative flex flex-col rounded-2xl border-2 border-brand bg-surface p-7 shadow-2xl shadow-brand/20">
              <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-[10px] font-semibold tracking-widest text-accent-contrast uppercase">
                Recomendado
              </span>

              <h2 className="text-xl font-semibold">TapGo Smart</h2>
              <p className="mt-1 text-sm text-muted">Convertí tu placa en inteligente.</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">{SMART_PRICE}</span>
                <span className="text-sm text-muted">/mes</span>
              </p>
              <p className="mt-1 text-sm font-medium text-brand">Suscripción opcional</p>

              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-muted">
                {SMART_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
              <a
                href="/registro"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
              >
                Activar Smart
              </a>
            </li>

            <li className="flex flex-col rounded-2xl border border-border bg-surface p-7">
              <h2 className="text-xl font-semibold">TapGo Business</h2>
              <p className="mt-1 text-sm text-muted">Para negocios que necesitan más control.</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">{BUSINESS_PRICE}</span>
                <span className="text-sm text-muted">/mes</span>
              </p>
              <p className="mt-1 text-sm font-medium text-brand">Suscripción opcional</p>

              <ul className="mt-6 flex flex-col gap-2.5 text-sm text-muted">
                {BUSINESS_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs tracking-wide text-muted uppercase">Próximamente</p>
              <ul className="mt-2 flex flex-col gap-2 text-sm text-muted">
                {BUSINESS_COMING_SOON.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="mt-0.5">
                      —
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
              <a
                href="/registro"
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-muted"
              >
                Ver Business
              </a>
            </li>
          </ul>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-brand/30 bg-brand/5 px-6 py-5 text-center">
            <p className="font-semibold text-brand">
              {TRIAL_DAYS} días de TapGo Smart gratis al comprar tu placa
            </p>
            <p className="mt-1 text-sm text-muted">
              Probá analytics, contenido dinámico y reportes sin costo antes
              de decidir si seguís con la suscripción.
            </p>
          </div>
        </section>

        {/* Precio de la placa según cuántas comprás. */}
        <section className="border-t border-border bg-surface-muted">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
            <h2 className="text-2xl font-semibold text-balance sm:text-3xl">
              Cuantas más placas, menor el precio por unidad
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Pago único. Incluye diseño, programación y entrega lista para
              usar.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HARDWARE_TIERS.map((tier, index) => (
                <li
                  key={tier.placas}
                  className={cx(
                    "flex flex-col items-center gap-1 rounded-2xl border bg-surface p-6 text-center",
                    index === HARDWARE_TIERS.length - 1
                      ? "border-2 border-brand"
                      : "border-border",
                  )}
                >
                  <span className="text-sm font-medium text-muted">
                    {tier.placas === 1 ? "1 placa" : `${tier.placas} placas`}
                  </span>
                  <span className="text-2xl font-semibold tracking-tight">{tier.price}</span>
                  <span className="text-xs text-muted">{tier.perUnit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Adicionales. */}
        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Adicionales</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            <li className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6">
              <span>Placa adicional</span>
              <span className="text-lg font-semibold">{ADDON_PLACA_PRICE}</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6">
              <span>NFC adicional</span>
              <span className="text-lg font-semibold">{ADDON_NFC_PRICE}</span>
            </li>
          </ul>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted">
            ¿Necesitás una propuesta a medida, con más placas o varias
            sucursales?{" "}
            <Link href="/#contacto" className="font-medium text-brand hover:underline">
              Conversemos
            </Link>
            .
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted">
            ¿Buscás qué se instala y se configura en cada nivel, más allá del
            precio?{" "}
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
