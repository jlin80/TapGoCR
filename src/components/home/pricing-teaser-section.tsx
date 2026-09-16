import { Check, SectionHeading } from "@/components/marketing";
import { CrossOriginLinkButton, cx, LinkButton } from "@/components/ui";
import {
  BUSINESS_FEATURES,
  BUSINESS_PRICE,
  HARDWARE_TIERS,
  SMART_FEATURES,
  SMART_PRICE,
  TAPGO_FEATURES,
  TRIAL_DAYS,
} from "@/lib/offers";

/**
 * Vista previa de precios en la landing: la placa (pago único) y las dos
 * suscripciones opcionales de software, con los datos de `src/lib/offers.ts`
 * (la misma fuente que usa `/precios`).
 */
export function PricingTeaserSection() {
  return (
    <section id="precios-preview" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Precios"
          title="Elegí cómo querés usar TapGo"
          description="Comprá tu placa una sola vez o llevála al siguiente nivel con TapGo Smart."
        />

        <ul className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
          <li className="reveal lift flex flex-col rounded-2xl border border-border bg-surface p-7">
            <h3 className="text-lg font-semibold">TapGo</h3>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">
                Desde {HARDWARE_TIERS[0].price}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">Pago único · tu placa es tuya</p>

            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
              {TAPGO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <CrossOriginLinkButton href="/registro" variant="secondary" className="mt-6">
              Comprar placa
            </CrossOriginLinkButton>
          </li>

          <li className="reveal reveal-2 lift relative flex flex-col rounded-2xl border-2 border-brand bg-surface p-7 shadow-xl shadow-brand/20">
            <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-[10px] font-semibold tracking-widest text-accent-contrast uppercase">
              Recomendado
            </span>

            <h3 className="text-lg font-semibold">TapGo Smart</h3>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{SMART_PRICE}</span>
              <span className="text-sm text-muted">/mes</span>
            </p>
            <p className="mt-1 text-sm text-muted">Convertí tu placa en inteligente</p>

            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
              {SMART_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <CrossOriginLinkButton href="/registro" variant="primary" className="mt-6">
              Activar Smart
            </CrossOriginLinkButton>
          </li>

          <li className="reveal lift flex flex-col rounded-2xl border border-border bg-surface p-7">
            <h3 className="text-lg font-semibold">TapGo Business</h3>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">{BUSINESS_PRICE}</span>
              <span className="text-sm text-muted">/mes</span>
            </p>
            <p className="mt-1 text-sm text-muted">Para negocios que necesitan más control</p>

            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
              {BUSINESS_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <LinkButton href="/precios" variant="secondary" className="mt-6">
              Ver Business
            </LinkButton>
          </li>
        </ul>

        <div
          className={cx(
            "reveal mt-10 flex flex-col items-center gap-1 rounded-2xl border border-brand/30 bg-brand/5 px-6 py-5 text-center",
          )}
        >
          <p className="font-semibold text-brand">
            {TRIAL_DAYS} días de TapGo Smart gratis al comprar tu placa
          </p>
          <p className="text-sm text-muted">
            Probá analytics, contenido dinámico y reportes sin costo antes de decidir.
          </p>
        </div>

        <div className="reveal mt-8 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-sm text-muted">
            Mientras más placas comprás, menor es el precio por unidad. Mirá
            la tabla completa y los adicionales en la página de precios.
          </p>
          <LinkButton href="/precios" variant="primary">
            Ver planes completos
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
