import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import type { NavGroup } from "@/components/side-nav";
import { requireRoot } from "@/lib/authz";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV: NavGroup[] = [
  {
    title: "Operación",
    items: [
      { href: "/app/dashboard", label: "Hoy" },
      { href: "/app/clients", label: "Clientes" },
      { href: "/app/analytics", label: "Analytics" },
      { href: "/app/metrics", label: "Métricas" },
    ],
  },
  {
    title: "Inventario",
    items: [
      { href: "/app/businesses", label: "Negocios" },
      { href: "/app/tags", label: "Tags" },
      { href: "/app/chips", label: "Chips" },
      { href: "/app/templates", label: "Templates" },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/app/registrations", label: "Altas pendientes" },
      { href: "/app/leads", label: "Consultas" },
      { href: "/app/requests", label: "Solicitudes" },
      { href: "/app/services", label: "Servicios" },
      { href: "/app/domains", label: "Dominios" },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/app/users", label: "Usuarios" },
      { href: "/app/settings", label: "Configuración" },
    ],
  },
];


export default async function AdminLayout({ children }: LayoutProps<"/app">) {
  // Segunda barrera, independiente del proxy: el proxy solo hace comprobaciones
  // optimistas de enrutado.
  const user = await requireRoot();

  return (
    <AppShell
      groups={NAV}
      userName={user.name}
      userEmail={user.email}
      subtitle="Consola ROOT"
      homeHref="/app/dashboard"
    >
      {children}
    </AppShell>
  );
}
