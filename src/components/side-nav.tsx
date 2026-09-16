"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { cx } from "@/components/ui";

export type NavItem = { href: string; label: string };

/** Grupo de secciones con su encabezado. */
export type NavGroup = { title: string; items: NavItem[] };

/**
 * Navegación de los paneles.
 *
 * Dos composiciones distintas, no una apilada:
 *
 * - En escritorio, una lateral agrupada por el trabajo que representa cada
 *   sección. Antes eran trece enlaces planos donde "Altas pendientes" y
 *   "Solicitudes" se confundían; agrupados, la lista se recorre por bloques.
 *
 * - En móvil, un desplegable cerrado que muestra dónde estás. Desplegar los
 *   cuatro grupos ocupaba unos 700px verticales y empujaba el contenido fuera
 *   de la pantalla: en un teléfono la navegación es un destino ocasional, no
 *   algo que deba estar siempre a la vista.
 */
export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const items = groups.flatMap((group) => group.items);
  const current = items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="tap-target flex w-full items-center justify-between gap-3 rounded-md bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-surface-muted md:hidden"
      >
        <span className="truncate">{current?.label ?? "Secciones"}</span>
        <span
          aria-hidden="true"
          className={cx(
            "shrink-0 text-muted transition-transform",
            open && "rotate-90",
          )}
        >
          &rsaquo;
        </span>
      </button>

      <nav
        id={panelId}
        aria-label="Secciones"
        className={cx(
          "flex-col gap-6 max-md:mt-2 md:flex",
          open ? "flex" : "hidden",
        )}
      >
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
              {group.title}
            </p>

            <div className="flex flex-col">
              {group.items.map((item) => {
                const active = item.href === current?.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    // Se cierra al elegir: si no, el menú tapa la página que
                    // acaba de abrirse. Se hace en el clic y no en un efecto
                    // sobre `pathname`, que es escribir estado durante el
                    // render de la ruta nueva.
                    onClick={() => setOpen(false)}
                    className={cx(
                      // `tap-target` da 44px de alto cuando se apunta con el dedo.
                      "tap-target relative flex items-center rounded-md px-3 text-sm transition-colors",
                      active
                        ? // Peso y un filete, en lugar de un bloque de color
                          // saturado: en una lista de trece enlaces el relleno
                          // teal grita más de lo necesario.
                          "font-semibold text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-brand"
                        : "text-muted hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
