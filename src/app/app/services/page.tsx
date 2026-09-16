import type { Metadata } from "next";
import Link from "next/link";

import { Badge, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { requireRoot } from "@/lib/authz";
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_TONES,
  SERVICE_TYPE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServicesPage() {
  await requireRoot();

  const services = await prisma.businessService.findMany({
    orderBy: [{ status: "asc" }, { renewalDate: "asc" }],
    select: {
      id: true,
      type: true,
      status: true,
      provider: true,
      renewalDate: true,
      business: { select: { id: true, name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Todo lo que TapGoCR presta, en un solo listado. Se editan desde la ficha de cada negocio."
      />

      {services.length === 0 ? (
        <EmptyState
          title="Sin servicios registrados"
          description="Registralos desde la pestaña Servicios de cada negocio."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Negocio</Th>
              <Th>Servicio</Th>
              <Th>Estado</Th>
              <Th>Proveedor</Th>
              <Th>Renovación</Th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <Td label="Negocio">
                  <Link
                    href={`/app/businesses/${service.business.id}/services`}
                    className="font-medium hover:text-brand"
                  >
                    {service.business.name}
                  </Link>
                </Td>
                <Td label="Servicio">{SERVICE_TYPE_LABELS[service.type]}</Td>
                <Td label="Estado">
                  <Badge tone={SERVICE_STATUS_TONES[service.status]}>
                    {SERVICE_STATUS_LABELS[service.status]}
                  </Badge>
                </Td>
                <Td label="Proveedor" className="text-muted">{service.provider ?? "—"}</Td>
                <Td label="Renovación" className="text-muted">{formatDate(service.renewalDate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
