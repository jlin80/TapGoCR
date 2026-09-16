"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui";

/**
 * Navegación entre las vistas de una misma entidad.
 *
 * Antes esto reutilizaba la barra lateral, que es otra cosa: una lateral ordena
 * secciones independientes del producto, y unas pestañas ordenan facetas de un
 * mismo objeto. Se ven distintas porque significan cosas distintas.
 *
 * Subrayado en lugar de píldoras: la píldora rellena compite con el nombre del
 * negocio que está justo encima, y aquí la pestaña es información secundaria.
 *
 * Es componente de cliente por `usePathname`: el layout que la usa es de
 * servidor y no conoce la subruta activa.
 */
export function Tabs({ items }: { items: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Vistas del negocio"
      // `overflow-y-hidden` es lo que quita las flechas: el `-mb-px` de cada
      // pestaña genera 1px de desbordamiento vertical, y al declarar solo
      // `overflow-x`, el navegador calcula `overflow-y: auto` y dibuja una
      // barra de scroll vertical con flechas por ese pixel.
      className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border"
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "tap-target -mb-px flex shrink-0 items-center border-b-2 px-3.5 text-sm transition-colors",
              active
                ? "border-brand font-semibold text-foreground"
                : "border-transparent text-muted hover:border-border hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
