import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/components/ui";

/**
 * Piezas de la consola.
 *
 * Nacen de un rediseño concreto: el panel anterior era una rejilla de doce
 * tarjetas de métrica con idéntico peso visual, sin una sola acción. Este
 * producto no necesita un muro de KPIs; necesita saber qué reclama atención
 * hoy y poder ir a resolverlo.
 *
 * De ahí las dos piezas centrales: `AttentionList`, que es lo primero de la
 * pantalla y lo único con acciones, y `StatRail`, que relega las cifras a una
 * línea de contexto sin cajas.
 */

// ---------------------------------------------------------------------------
// Cifras
// ---------------------------------------------------------------------------

export type Stat = {
  label: string;
  value: number;
  hint?: string;
  /** Enlace a la sección que desarrolla esa cifra. */
  href?: string;
};

/**
 * Riel de cifras: una línea de números separados por un filete.
 *
 * Sustituye a la rejilla de tarjetas. Aquí el número es el protagonista y la
 * etiqueta se retira; un cero se atenúa en lugar de ocupar el mismo espacio
 * visual que un dato real.
 */
export function StatRail({ stats }: { stats: Stat[] }) {
  return (
    <div className="stat-rail">
      {stats.map((stat) => {
        const contenido = (
          <>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value mt-2">{stat.value.toLocaleString("es-CR")}</p>
            {stat.hint ? (
              <p className="mt-1.5 text-xs text-muted">{stat.hint}</p>
            ) : null}
          </>
        );

        const clases = cx(stat.value === 0 && "stat-zero");

        return stat.href ? (
          <Link
            key={stat.label}
            href={stat.href}
            className={cx(clases, "transition-colors hover:bg-surface-muted")}
          >
            {contenido}
          </Link>
        ) : (
          <div key={stat.label} className={clases}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atención
// ---------------------------------------------------------------------------

export type Severity = "critical" | "warning" | "info";

export type AttentionItem = {
  id: string;
  severity: Severity;
  /** Qué pasa, en una línea y en lenguaje humano. */
  title: string;
  /** El dato que sustenta el aviso. */
  detail?: string;
  /** Qué hacer al respecto. */
  actionLabel: string;
  href: string;
};

const SEVERITY_MARK: Record<Severity, string> = {
  critical: "bg-danger",
  warning: "bg-accent",
  info: "bg-brand",
};

/**
 * Lo que reclama atención, ordenado por urgencia.
 *
 * Es una lista y no una rejilla de tarjetas a propósito: una lista tiene un
 * orden, y el orden ES la jerarquía. Cada fila lleva una franja de color a la
 * izquierda —el único uso de color con función en la pantalla— y termina en la
 * acción concreta que la resuelve.
 */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="surface-sunken px-6 py-10 text-center">
        <p className="text-sm font-medium">Nada requiere tu atención.</p>
        <p className="mt-1 text-sm text-muted">
          Sin chips en el tope, altas sin revisar ni dominios por vencer.
        </p>
      </div>
    );
  }

  return (
    <ul className="surface-panel divide-hairline overflow-hidden">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="group flex items-center gap-4 py-4 pr-5 pl-0 transition-colors hover:bg-surface-muted"
          >
            <span
              aria-hidden="true"
              className={cx("h-10 w-1 shrink-0 rounded-r", SEVERITY_MARK[item.severity])}
            />

            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.title}</span>
              {item.detail ? (
                <span className="mt-0.5 block truncate text-sm text-muted">
                  {item.detail}
                </span>
              ) : null}
            </span>

            {/*
              La acción está siempre visible, atenuada, y se enciende al pasar
              por encima. Ocultarla hasta el hover la dejaba invisible en tablet
              y en cualquier dispositivo táctil, que es justo donde más falta
              hace saber qué va a pasar antes de tocar.
            */}
            <span className="hidden shrink-0 text-sm font-medium text-muted transition-colors group-hover:text-brand sm:block">
              {item.actionLabel}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
            >
              &rsaquo;
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Encabezado de sección
// ---------------------------------------------------------------------------

/**
 * Título de un grupo dentro de una página.
 *
 * Sin caja y sin borde: el aire y el peso tipográfico bastan para separar. La
 * acción opcional va a la derecha, en la misma línea, porque es donde se busca.
 */
export function GroupHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
