"use client";

import { useState } from "react";

import { SectionHeading } from "@/components/marketing";
import { CrossOriginLinkButton, cx } from "@/components/ui";

/**
 * Selector simple, no un configurador: elegís UNA meta y ves a qué solución
 * de `solutions-section.tsx` corresponde. Sin estado persistido, sin pasos —
 * la recomendación cambia en el mismo click.
 */
const GOALS = [
  { label: "Más reseñas", solution: "TapGo Reviews" },
  { label: "Más mensajes por WhatsApp", solution: "TapGo WhatsApp" },
  { label: "Compartir mi menú", solution: "TapGo Menú" },
  { label: "Mostrar mis redes", solution: "TapGo Social" },
  { label: "Tener varias acciones", solution: "TapGo Business" },
  { label: "Otra cosa", solution: "TapGo Business" },
] as const;

export function GoalPickerSection() {
  const [active, setActive] = useState<(typeof GOALS)[number] | null>(null);

  return (
    <section className="border-b border-border bg-surface-muted">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:py-24 lg:py-28">
        <SectionHeading eyebrow="No sabés por dónde empezar" title="¿Qué querés conseguir?" />

        <div className="reveal mt-10 flex flex-wrap justify-center gap-2.5">
          {GOALS.map((goal) => (
            <button
              key={goal.label}
              type="button"
              aria-pressed={active?.label === goal.label}
              onClick={() => setActive(goal)}
              className={cx(
                "tap-target rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                active?.label === goal.label
                  ? "border-brand bg-brand text-brand-contrast"
                  : "border-border bg-surface hover:border-brand/40",
              )}
            >
              {goal.label}
            </button>
          ))}
        </div>

        {active ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
            <p className="text-lg">
              Para conseguir <strong className="font-semibold">{active.label.toLowerCase()}</strong>, te
              recomendamos <strong className="font-semibold text-brand">{active.solution}</strong>.
            </p>
            <CrossOriginLinkButton href="/registro" variant="primary">
              Quiero esto
            </CrossOriginLinkButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
