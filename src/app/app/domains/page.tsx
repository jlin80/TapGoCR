import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { requireRoot } from "@/lib/authz";
import { expiryInfo, type ExpiryLevel } from "@/lib/domain-expiry";
import { DOMAIN_STATUS_LABELS, DOMAIN_STATUS_TONES, formatDate } from "@/lib/labels";
import { mailerConfigured } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dominios" };

export default async function DomainsPage() {
  await requireRoot();

  const domains = await prisma.domain.findMany({
    orderBy: [{ expiresAt: "asc" }],
    select: {
      id: true,
      domain: true,
      status: true,
      registrar: true,
      expiresAt: true,
      autoRenew: true,
      lastNoticeAt: true,
      business: { select: { id: true, name: true } },
    },
  });

  // Se resuelve una sola vez y se ordena por urgencia: lo que esta por vencer
  // tiene que estar arriba, no perdido en orden alfabetico.
  const rows = domains
    .map((domain) => ({ ...domain, expiry: expiryInfo(domain.expiresAt) }))
    .sort((a, b) => (a.expiry.daysLeft ?? 9e9) - (b.expiry.daysLeft ?? 9e9));

  const urgentes = rows.filter(
    (row) => row.expiry.level === "URGENT" || row.expiry.level === "EXPIRED",
  );
  const proximos = rows.filter((row) => row.expiry.level === "SOON");

  return (
    <>
      <PageHeader
        title="Dominios"
        description="Dominios administrados por TapGoCR. La compra y el DNS se gestionan fuera de la plataforma."
      />

      {urgentes.length > 0 || proximos.length > 0 ? (
        <Card className="mb-6 border-warning bg-warning-soft">
          <p className="text-sm font-medium text-warning">
            {urgentes.length > 0
              ? `${urgentes.length} dominio(s) vencidos o a menos de 14 días.`
              : `${proximos.length} dominio(s) vencen en menos de 60 días.`}
          </p>
          <p className="mt-1 text-xs text-warning">
            {mailerConfigured()
              ? "Los avisos automáticos al cliente están activos."
              : "Sin SMTP configurado no se envía ningún aviso al cliente. Definí SMTP_HOST, SMTP_USER, SMTP_PASSWORD y SMTP_FROM."}
          </p>
        </Card>
      ) : null}

      {domains.length === 0 ? (
        <EmptyState
          title="Sin dominios registrados"
          description="Registralos desde la pestaña Dominios de cada negocio."
        />
      ) : (
        <Table stackUntil="lg">
          <thead>
            <tr>
              <Th>Dominio</Th>
              <Th>Negocio</Th>
              <Th>Estado</Th>
              <Th>Registrador</Th>
              <Th>Vence</Th>
              <Th>Auto-renueva</Th>
              <Th>Último aviso</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((domain) => (
              <tr key={domain.id}>
                <Td label="Dominio" className="font-medium">{domain.domain}</Td>
                <Td label="Negocio">
                  <Link
                    href={`/app/businesses/${domain.business.id}/domains`}
                    className="hover:text-brand"
                  >
                    {domain.business.name}
                  </Link>
                </Td>
                <Td label="Estado">
                  <Badge tone={DOMAIN_STATUS_TONES[domain.status]}>
                    {DOMAIN_STATUS_LABELS[domain.status]}
                  </Badge>
                </Td>
                <Td label="Registrador" className="text-muted">{domain.registrar ?? "—"}</Td>
                <Td label="Vence">
                  <span className="text-muted">{formatDate(domain.expiresAt)}</span>
                  <ExpiryBadge level={domain.expiry.level} days={domain.expiry.daysLeft} />
                </Td>
                <Td label="Auto-renueva" className="text-muted">{domain.autoRenew ? "Sí" : "No"}</Td>
                <Td label="Último aviso" className="text-muted">
                  {domain.lastNoticeAt ? formatDate(domain.lastNoticeAt) : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

const EXPIRY_TONES: Record<ExpiryLevel, "neutral" | "warning" | "danger"> = {
  OK: "neutral",
  SOON: "warning",
  URGENT: "danger",
  EXPIRED: "danger",
};

/**
 * Estado del vencimiento junto a la fecha. La fecha sola obliga a hacer la
 * cuenta mentalmente, que es justo lo que hace que a alguien se le pase.
 */
function ExpiryBadge({
  level,
  days,
}: {
  level: ExpiryLevel;
  days: number | null;
}) {
  if (days === null || level === "OK") return null;

  const label =
    days < 0
      ? `vencido hace ${Math.abs(days)} d`
      : days === 0
        ? "vence hoy"
        : `en ${days} d`;

  return (
    <span className="ml-2">
      <Badge tone={EXPIRY_TONES[level]}>{label}</Badge>
    </span>
  );
}
