import type { Metadata } from "next";
import Link from "next/link";

import { AnalyticsView } from "@/components/analytics-view";
import { SubmitButton } from "@/components/confirm-button";
import { QuotaBadge, QuotaBar } from "@/components/quota";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { BusinessRole, ScanEventType } from "@/generated/prisma/enums";
import { getBusinessSummary } from "@/lib/analytics";
import { requireRoot } from "@/lib/authz";
import { chipsForBusiness, placaQuotaFor } from "@/lib/chips";
import { tagUrl } from "@/lib/config";
import { LINK_TYPE_LABELS } from "@/lib/link-types";
import {
  CHIP_STATUS_LABELS,
  CHIP_STATUS_TONES,
  DOMAIN_STATUS_LABELS,
  DOMAIN_STATUS_TONES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  REQUEST_TYPE_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_TONES,
  SERVICE_TYPE_LABELS,
  formatDate,
} from "@/lib/labels";
import { PLAN_LABELS, PLAN_TONES } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { toggleBusinessActive } from "@/server/business-actions";

export const metadata: Metadata = { title: "Ficha del cliente" };

const ROLE_LABELS: Record<BusinessRole, string> = {
  OWNER: "Propietario",
  MANAGER: "Gestor",
  VIEWER: "Solo lectura",
};

/**
 * Ficha completa de un cliente.
 *
 * Junta en una sola página todo lo que hoy está repartido entre las pestañas del
 * negocio. Es de solo lectura salvo el interruptor de corte: para editar cada
 * cosa se enlaza a la pantalla correspondiente, de modo que no haya dos
 * formularios distintos para lo mismo.
 */
export default async function ClientDossierPage({
  params,
}: PageProps<"/app/clients/[id]">) {
  const { id } = await params;
  await requireRoot();

  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      whatsapp: true,
      address: true,
      websiteUrl: true,
      active: true,
      createdAt: true,
      plan: true,
      planStartedAt: true,
      includedTagsOverride: true,
      links: {
        orderBy: [{ position: "asc" }],
        select: { id: true, type: true, label: true, url: true, active: true },
      },
      tags: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          active: true,
          locationLabel: true,
          _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
        },
      },
      members: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true, active: true } },
        },
      },
      services: { orderBy: { createdAt: "asc" } },
      domains: { orderBy: { createdAt: "asc" } },
      requests: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!business) {
    return (
      <EmptyState
        title="Este cliente no existe"
        description="Puede que se haya eliminado."
        action={<LinkButton href="/app/clients">Volver a clientes</LinkButton>}
      />
    );
  }

  const [summary, chips, quota] = await Promise.all([
    getBusinessSummary(business.id),
    chipsForBusiness(business.id),
    placaQuotaFor(business),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <Link href="/app/clients" className="text-sm text-muted hover:text-foreground">
          &lsaquo; Clientes
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          <Badge tone={business.active ? "success" : "neutral"}>
            {business.active ? "Activo" : "Cortado"}
          </Badge>
          <Badge tone={PLAN_TONES[business.plan]}>{PLAN_LABELS[business.plan]}</Badge>
          {quota.level === "EXCEEDED" ? (
            <Badge tone="danger">Tope superado</Badge>
          ) : quota.level === "WARNING" ? (
            <Badge tone="warning">Cerca del tope</Badge>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-muted">
          {business.slug} · cliente desde {formatDate(business.createdAt)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href={`/app/businesses/${business.id}`}>Editar datos</LinkButton>
          <LinkButton href={`/app/businesses/${business.id}/tags`}>Tags</LinkButton>
          <LinkButton href={`/app/businesses/${business.id}/services`}>
            Servicios
          </LinkButton>
          <LinkButton href={`/app/businesses/${business.id}/domains`}>
            Dominios
          </LinkButton>

          <form action={toggleBusinessActive}>
            <input type="hidden" name="businessId" value={business.id} />
            <SubmitButton
              variant={business.active ? "danger" : "primary"}
              confirm={
                business.active
                  ? `Cortar el servicio de ${business.name} apaga todas sus landings. ¿Continuar?`
                  : undefined
              }
            >
              {business.active ? "Cortar servicio" : "Reactivar servicio"}
            </SubmitButton>
          </form>
        </div>
      </header>

      <section>
        <div className="stat-rail">
          <StatCard label="Scans hoy" value={summary.scansToday} />
          <StatCard label="Scans 30 días" value={summary.scans30d} />
          <StatCard label="Clics 30 días" value={summary.clicks30d} />
          <StatCard
            label="Chips instalados"
            value={chips.length}
            hint={PLAN_LABELS[business.plan]}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Plan y placas</h2>
        <p className="mb-3 text-sm text-muted">
          Placas activas contra las incluidas en el plan. Los taps son siempre ilimitados.
        </p>
        <Card className="max-w-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Badge tone={PLAN_TONES[business.plan]}>{PLAN_LABELS[business.plan]}</Badge>
            <QuotaBadge quota={quota} />
          </div>
          <QuotaBar quota={quota} />
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Chips</h2>
        {chips.length === 0 ? (
          <EmptyState
            title="Sin chips registrados"
            description="Registralos en la sección Chips y asociálos a los tags de este cliente."
            action={<LinkButton href="/app/chips">Ir a chips</LinkButton>}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {chips.map((chip) => (
              <li key={chip.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">{chip.uid}</span>
                    <Badge tone={CHIP_STATUS_TONES[chip.status]}>
                      {CHIP_STATUS_LABELS[chip.status]}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted">
                    {chip.tag ? `${chip.tag.name} · ${chip.tag.code}` : "Sin tag"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tags</h2>
        {business.tags.length === 0 ? (
          <EmptyState title="Sin tags" description="Este cliente no tiene tags creados." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tag</Th>
                <Th>Código</Th>
                <Th>URL</Th>
                <Th>Scans</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {business.tags.map((tag) => (
                <tr key={tag.id}>
                  <Td label="Tag">
                    <Link
                      href={`/app/tags/${tag.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {tag.name}
                    </Link>
                    {tag.locationLabel ? (
                      <span className="block text-xs text-muted">
                        {tag.locationLabel}
                      </span>
                    ) : null}
                  </Td>
                  <Td label="Código" className="font-mono text-xs">{tag.code}</Td>
                  <Td label="URL" className="max-w-xs truncate text-xs text-muted">
                    {tagUrl(tag.code)}
                  </Td>
                  <Td label="Scans" className="tabular-nums">
                    {tag._count.events.toLocaleString("es-CR")}
                  </Td>
                  <Td label="Estado">
                    <Badge tone={tag.active ? "success" : "neutral"}>
                      {tag.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Analytics</h2>
        <AnalyticsView businessId={business.id} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Enlaces de la landing</h2>
          <Card className="p-0">
            {business.links.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">Sin enlaces.</p>
            ) : (
              <ul className="divide-y divide-border">
                {business.links.map((link) => (
                  <li key={link.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {link.label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {link.url}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {LINK_TYPE_LABELS[link.type]}
                    </span>
                    {!link.active ? <Badge tone="neutral">Oculto</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Usuarios con acceso</h2>
          <Card className="p-0">
            {business.members.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">
                Ningún cliente tiene acceso todavía.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {business.members.map((member) => (
                  <li
                    key={member.user.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {member.user.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {member.user.email}
                      </span>
                    </span>
                    <Badge tone="info">{ROLE_LABELS[member.role]}</Badge>
                    {!member.user.active ? (
                      <Badge tone="danger">Suspendida</Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Servicios</h2>
          <Card className="p-0">
            {business.services.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">Sin servicios registrados.</p>
            ) : (
              <ul className="divide-y divide-border">
                {business.services.map((service) => (
                  <li
                    key={service.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <span className="flex-1 text-sm font-medium">
                      {SERVICE_TYPE_LABELS[service.type]}
                    </span>
                    <Badge tone={SERVICE_STATUS_TONES[service.status]}>
                      {SERVICE_STATUS_LABELS[service.status]}
                    </Badge>
                    <span className="text-xs text-muted">
                      Renueva {formatDate(service.renewalDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Dominios</h2>
          <Card className="p-0">
            {business.domains.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">Sin dominios registrados.</p>
            ) : (
              <ul className="divide-y divide-border">
                {business.domains.map((domain) => (
                  <li
                    key={domain.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <span className="flex-1 text-sm font-medium">{domain.domain}</span>
                    <Badge tone={DOMAIN_STATUS_TONES[domain.status]}>
                      {DOMAIN_STATUS_LABELS[domain.status]}
                    </Badge>
                    <span className="text-xs text-muted">
                      Vence {formatDate(domain.expiresAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Últimas solicitudes</h2>
        <Card className="p-0">
          {business.requests.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">Sin solicitudes.</p>
          ) : (
            <ul className="divide-y divide-border">
              {business.requests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <Badge tone={REQUEST_STATUS_TONES[request.status]}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {request.title}
                  </span>
                  <span className="text-xs text-muted">
                    {REQUEST_TYPE_LABELS[request.type]} ·{" "}
                    {formatDate(request.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
