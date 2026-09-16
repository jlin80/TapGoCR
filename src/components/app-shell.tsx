import Link from "next/link";
import type { ReactNode } from "react";

import { AutoRefresh } from "@/components/auto-refresh";
import { BrandWordmark } from "@/components/brand";
import { SideNav, type NavGroup } from "@/components/side-nav";
import { Button } from "@/components/ui";
import { signOutAction } from "@/server/session-actions";

/**
 * Estructura común de los paneles: barra de marca, navegación lateral y área de
 * contenido. El panel de cliente usa el mismo armazón con menos secciones.
 */
export function AppShell({
  groups,
  userName,
  userEmail,
  subtitle,
  homeHref,
  children,
}: {
  groups: NavGroup[];
  userName: string | null;
  userEmail: string | null;
  subtitle?: string;
  /** A dónde lleva el logo: el propio panel, nunca el sitio público. */
  homeHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <AutoRefresh />
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur print:hidden">
        <div className="console-container flex items-center justify-between gap-4 py-3">
          <div className="flex items-baseline gap-3">
            <Link href={homeHref} aria-label="Ir al panel">
              <BrandWordmark />
            </Link>
            {subtitle ? (
              <span className="hidden text-sm text-muted sm:inline">{subtitle}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{userName ?? "Usuario"}</p>
              <p className="text-xs text-muted">{userEmail}</p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="console-container flex w-full flex-1 flex-col gap-6 py-6 md:flex-row print:block print:p-0">
        <aside className="md:w-52 md:shrink-0 lg:w-56 print:hidden">
          <SideNav groups={groups} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
