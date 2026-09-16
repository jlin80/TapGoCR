import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  EmptyState,
  LinkButton,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { StatRail } from "@/components/console";
import { requireRoot } from "@/lib/authz";
import { clientsComparison } from "@/lib/clients-overview";
import { formatDate } from "@/lib/labels";
import { PLAN_LABELS } from "@/lib/plans";

export const metadata: Metadata = { title: "Clientes" };

/**
 * Vista comparativa de todos los clientes.
 *
 * Es la entrada de la consola ROOT: de un vistazo se ve quién crece, quién está
 * quieto y quién necesita atención, con un enlace a la ficha completa.
 */
export default async function ClientsPage() {
  await requireRoot();

  const clients = await clientsComparison();

  if (clients.length === 0) {
    return (
      <>
        <PageHeader title="Clientes" />
        <EmptyState
          title="Todavía no hay clientes"
          description="Creá el primer negocio para empezar."
          action={
            <LinkButton href="/app/businesses/new" variant="primary">
              Nuevo negocio
            </LinkButton>
          }
        />
      </>
    );
  }

  const totals = clients.reduce(
    (acc, client) => ({
      scans30d: acc.scans30d + client.scans30d,
      tagsActive: acc.tagsActive + client.tagsActive,
      chips: acc.chips + client.chips,
      alerts: acc.alerts + (client.quotaLevel === "OK" ? 0 : 1),
    }),
    { scans30d: 0, tagsActive: 0, chips: 0, alerts: 0 },
  );

  // Más movimiento primero: es el orden útil para decidir a quién atender.
  const sorted = [...clients].sort((a, b) => b.scans30d - a.scans30d);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Todos los negocios comparados. Ordenados por actividad de los últimos 30 días."
        actions={
          <LinkButton href="/app/businesses/new" variant="primary">
            Nuevo negocio
          </LinkButton>
        }
      />

      <div className="mb-8">
        <StatRail
          stats={[
            { label: "Clientes", value: clients.length },
            { label: "Scans 30 días", value: totals.scans30d },
            {
              label: "Chips instalados",
              value: totals.chips,
              hint: `${totals.tagsActive.toLocaleString("es-CR")} placas activas`,
            },
            { label: "Alertas de cuota", value: totals.alerts },
          ]}
        />
      </div>

      <Table stackUntil="lg">
        <thead>
          <tr>
            <Th>Negocio</Th>
            <Th>Estado</Th>
            <Th>Plan</Th>
            <Th>Scans 30d</Th>
            <Th>Clics 30d</Th>
            <Th>Placas</Th>
            <Th>Chips</Th>
            <Th>Servicios</Th>
            <Th>Solicitudes</Th>
            <Th>Última actividad</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((client) => {
            const level = client.quotaLevel;

            return (
              <tr key={client.id}>
                <Td label="Negocio">
                  <Link
                    href={`/app/clients/${client.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {client.name}
                  </Link>
                  <span className="block text-xs text-muted">{client.slug}</span>
                </Td>
                <Td label="Estado">
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={client.active ? "success" : "neutral"}>
                      {client.active ? "Activo" : "Inactivo"}
                    </Badge>
                    {level === "EXCEEDED" ? (
                      <Badge tone="danger">Tope superado</Badge>
                    ) : level === "WARNING" ? (
                      <Badge tone="warning">Cerca del tope</Badge>
                    ) : null}
                  </span>
                </Td>
                <Td label="Plan">{PLAN_LABELS[client.plan]}</Td>
                <Td label="Scans 30d" className="tabular-nums">
                  {client.scans30d.toLocaleString("es-CR")}
                </Td>
                <Td label="Clics 30d" className="tabular-nums">
                  {client.clicks30d.toLocaleString("es-CR")}
                </Td>
                <Td label="Placas" className="tabular-nums">
                  {client.tagsActive}
                  <span className="text-muted">
                    {" "}
                    / {client.placaLimit !== null ? client.placaLimit.toLocaleString("es-CR") : "sin tope"}
                  </span>
                </Td>
                <Td label="Chips" className="tabular-nums">{client.chips}</Td>
                <Td label="Servicios" className="tabular-nums">{client.activeServices}</Td>
                <Td label="Solicitudes" className="tabular-nums">
                  {client.openRequests > 0 ? (
                    <Badge tone="info">{client.openRequests}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
                <Td label="Última actividad" className="text-muted">{formatDate(client.lastActivity)}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
