import type { Metadata } from "next";
import Link from "next/link";

import {
  AttentionList,
  GroupHeading,
  StatRail,
  type AttentionItem,
  type Stat,
} from "@/components/console";
import { LinkButton } from "@/components/ui";
import { getAdminOverview, getTodayActivity } from "@/lib/analytics";
import { requireRoot } from "@/lib/authz";
import { placaQuotaOverview } from "@/lib/chips";
import { expiryInfo } from "@/lib/domain-expiry";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Hoy" };

/**
 * Consola ROOT: qué requiere atención hoy.
 *
 * Rediseñada. Antes era una rejilla de doce tarjetas de métrica con el mismo
 * peso visual —tres de ellas para el mismo hecho, varias en cero— y ninguna
 * acción; lo único accionable quedaba enterrado debajo.
 *
 * La composición ahora sigue el orden en que se trabaja: primero lo que hay que
 * resolver, después el movimiento del día, y al final las cifras como contexto.
 * Las cifras no son el producto: son el telón de fondo.
 */
export default async function AdminDashboardPage() {
  await requireRoot();

  // En serie a propósito: cada una de estas funciones ya lanza varias consultas
  // en paralelo, y encadenarlas mantiene acotado el número de conexiones.
  const overview = await getAdminOverview();
  const activity = await getTodayActivity();
  const planQuotas = await placaQuotaOverview();
  const chipCounts = await prisma.chip.groupBy({ by: ["status"], _count: { _all: true } });
  const pendingRegistrations = await prisma.registration.count({
    where: { status: "PENDING" },
  });
  const domains = await prisma.domain.findMany({
    where: { expiresAt: { not: null }, status: { in: ["REGISTERED", "CONFIGURING", "ACTIVE", "EXPIRED"] } },
    select: { id: true, domain: true, expiresAt: true, business: { select: { id: true, name: true } } },
  });

  const attention = buildAttention({
    planQuotas,
    pendingRegistrations,
    newLeads: overview.newLeads,
    pendingRequests: overview.pendingRequests,
    domains,
  });

  const installedChips =
    chipCounts.find((row) => row.status === "INSTALLED")?._count._all ?? 0;
  const inStockChips =
    chipCounts.find((row) => row.status === "IN_STOCK")?._count._all ?? 0;

  // Las cifras que sobrevivieron. "Tags totales", "activos" e "inactivos" eran
  // tres tarjetas para un mismo hecho: ahora es una con el resto como detalle.
  const stats: Stat[] = [
    { label: "Negocios", value: overview.businesses, href: "/app/businesses" },
    {
      label: "Tags",
      value: overview.tagsTotal,
      hint: overview.tagsInactive > 0 ? `${overview.tagsInactive} inactivos` : "todos activos",
      href: "/app/tags",
    },
    {
      label: "Chips",
      value: installedChips,
      hint: `${inStockChips} en stock`,
      href: "/app/chips",
    },
    { label: "Scans", value: overview.scansTotal, hint: "histórico", href: "/app/analytics" },
    { label: "Clics", value: overview.clicksTotal, hint: "histórico", href: "/app/analytics" },
    { label: "Servicios activos", value: overview.activeServices, href: "/app/services" },
  ];

  return (
    <>
      {/*
        Sin el componente `PageHeader` genérico: esta pantalla merece un saludo
        con la acción primaria al lado, no un título con subtítulo gris.
      */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] font-semibold tracking-tight">
            Hoy
          </h1>
          <p className="mt-1 text-muted">
            {attention.length === 0
              ? "Todo en orden."
              : `${attention.length} ${attention.length === 1 ? "cosa requiere" : "cosas requieren"} tu atención.`}
          </p>
        </div>

        <LinkButton href="/app/businesses/new" variant="primary">
          Nuevo negocio
        </LinkButton>
      </header>

      <section className="mb-12">
        <AttentionList items={attention} />
      </section>

      <section className="mb-12">
        <GroupHeading
          title="Movimiento de hoy"
          description="Negocios con escaneos en el día en curso."
          action={
            <Link href="/app/analytics" className="text-sm font-medium text-brand hover:underline">
              Ver analytics
            </Link>
          }
        />

        {activity.length === 0 ? (
          <p className="surface-sunken px-6 py-8 text-center text-sm text-muted">
            Todavía no hay escaneos hoy.
          </p>
        ) : (
          <ul className="surface-panel divide-hairline overflow-hidden">
            {activity.map((row) => (
              <li key={row.businessId}>
                <Link
                  href={`/app/businesses/${row.businessId}/analytics`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="min-w-0 truncate font-medium">{row.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {row.scans.toLocaleString("es-CR")} scans
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <GroupHeading title="La plataforma en números" />
        <StatRail stats={stats} />
      </section>
    </>
  );
}

/**
 * Construye la lista de atención, ordenada por urgencia real.
 *
 * El orden no es casual: un chip que superó su tope afecta a un cliente que ya
 * está pagando; una consulta sin atender es una venta que se enfría. Lo urgente
 * va arriba y lo comercial después.
 */
function buildAttention({
  planQuotas,
  pendingRegistrations,
  newLeads,
  pendingRequests,
  domains,
}: {
  planQuotas: Awaited<ReturnType<typeof placaQuotaOverview>>;
  pendingRegistrations: number;
  newLeads: number;
  pendingRequests: number;
  domains: Array<{
    id: string;
    domain: string;
    expiresAt: Date | null;
    business: { id: string; name: string };
  }>;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const domain of domains) {
    const { level, daysLeft } = expiryInfo(domain.expiresAt);
    if (level !== "EXPIRED" && level !== "URGENT") continue;

    items.push({
      id: `dom-${domain.id}`,
      severity: level === "EXPIRED" ? "critical" : "warning",
      title:
        level === "EXPIRED"
          ? `${domain.domain} venció`
          : `${domain.domain} vence en ${daysLeft} días`,
      detail: domain.business.name,
      actionLabel: "Renovar",
      href: `/app/businesses/${domain.business.id}/domains`,
    });
  }

  for (const [businessId, quota] of planQuotas) {
    if (quota.level === "EXCEEDED") {
      items.push({
        id: `plan-x-${businessId}`,
        severity: "critical",
        title: `${quota.businessName} llegó al tope de placas de su plan`,
        detail: `${quota.activeTags.toLocaleString("es-CR")} de ${quota.limit?.toLocaleString("es-CR")} placas activas`,
        actionLabel: "Ver cliente",
        href: `/app/clients/${businessId}`,
      });
    } else if (quota.level === "WARNING") {
      items.push({
        id: `plan-w-${businessId}`,
        severity: "warning",
        title: `${quota.businessName} está cerca del tope de placas de su plan`,
        detail: `${quota.percent}% de las placas incluidas`,
        actionLabel: "Ver cliente",
        href: `/app/clients/${businessId}`,
      });
    }
  }

  if (pendingRegistrations > 0) {
    items.push({
      id: "altas",
      severity: "info",
      title: `${pendingRegistrations} ${pendingRegistrations === 1 ? "alta espera" : "altas esperan"} aprobación`,
      detail: "Hasta que las apruebes, esos negocios no pueden entrar.",
      actionLabel: "Revisar",
      href: "/app/registrations",
    });
  }

  if (newLeads > 0) {
    items.push({
      id: "consultas",
      severity: "info",
      title: `${newLeads} ${newLeads === 1 ? "consulta sin atender" : "consultas sin atender"}`,
      detail: "Desde el formulario del sitio comercial.",
      actionLabel: "Responder",
      href: "/app/leads",
    });
  }

  if (pendingRequests > 0) {
    items.push({
      id: "solicitudes",
      severity: "info",
      title: `${pendingRequests} ${pendingRequests === 1 ? "solicitud abierta" : "solicitudes abiertas"} de clientes`,
      detail: "Dominios, sitios web o mantenimiento pedidos desde su panel.",
      actionLabel: "Ver",
      href: "/app/requests",
    });
  }

  return items;
}
