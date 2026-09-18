import { Check, SectionHeading } from "@/components/marketing";
import { CrossOriginLinkButton, cx, LinkButton } from "@/components/ui";
import { PLANS } from "@/lib/offers";

/**
 * Vista previa de precios en la landing: los tres planes, con los datos de
 * `src/lib/offers.ts` (la misma fuente que usa `/precios`).
 */
export function PricingTeaserSection() {
  return (
    <section id="precios-preview" className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
        <SectionHeading
          eyebrow="Precios"
          title="Empezá pequeño. Crecé cuando lo necesités."
          description="Elegí la cantidad de puntos TapGo que necesitás hoy y agregá más cuando tu negocio crezca."
        />

        <ul className="mt-12 grid gap-6 sm:mt-16 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <li
              key={plan.slug}
              className={cx(
                "reveal lift relative flex flex-col rounded-2xl bg-surface p-7",
                plan.featured
                  ? "border-2 border-brand shadow-xl shadow-brand/20"
                  : "border border-border",
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1 text-[10px] font-semibold tracking-widest text-accent-contrast uppercase">
                  Más elegido
                </span>
              ) : null}

              <h3 className="text-lg font-semibold">{plan.name}</h3>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight">{plan.initialPrice}</span>
                <span className="text-sm text-muted">pago inicial</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                + {plan.monthlyPrice}<span className="text-xs">/mes</span> de plataforma
              </p>

              <ul className="mt-5 flex flex-col gap-2.5 text-sm text-muted">
                {plan.features.slice(0, 6).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <CrossOriginLinkButton
                href="/registro"
                variant={plan.featured ? "primary" : "secondary"}
                className="mt-6"
              >
                {plan.cta}
              </CrossOriginLinkButton>
            </li>
          ))}
        </ul>

        <p className="reveal mt-10 text-center text-sm text-muted">
          Empezá desde <strong className="font-semibold text-foreground">₡9.900</strong> con tu
          primera placa TapGo. Después, mantené tu plataforma desde{" "}
          <strong className="font-semibold text-foreground">₡1.990/mes</strong>. Precios en
          colones costarricenses.
        </p>

        <div className="reveal mt-6 flex flex-col items-center gap-4 text-center">
          <LinkButton href="/precios" variant="primary">
            Ver planes completos
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
