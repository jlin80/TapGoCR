import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import type { NavGroup } from "@/components/side-nav";
import { requireClient } from "@/lib/authz";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV: NavGroup[] = [
  {
    title: "Tu negocio",
    items: [
      { href: "/client/dashboard", label: "Resumen" },
      { href: "/client/analytics", label: "Analytics" },
      { href: "/client/tags", label: "Mis puntos TapGo" },
    ],
  },
  {
    title: "Lo que ven tus clientes",
    items: [
      { href: "/client/profile", label: "Mi página pública" },
      { href: "/client/menu", label: "Menú digital" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/client/business", label: "Mi negocio" },
      { href: "/client/requests", label: "Solicitudes" },
      { href: "/client/settings", label: "Configuración" },
    ],
  },
];


export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const user = await requireClient();

  return (
    <AppShell
      groups={NAV}
      userName={user.name}
      userEmail={user.email}
      homeHref="/client/dashboard"
    >
      {children}
    </AppShell>
  );
}
