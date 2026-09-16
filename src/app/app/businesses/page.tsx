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
import { ScanEventType } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Negocios" };

export default async function BusinessesPage() {
  await requireRoot();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      _count: {
        select: {
          tags: true,
          members: true,
          events: { where: { eventType: ScanEventType.SCAN } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Negocios"
        description="Todos los negocios administrados por TapGoCR."
        actions={
          <LinkButton href="/app/businesses/new" variant="primary">
            Nuevo negocio
          </LinkButton>
        }
      />

      {businesses.length === 0 ? (
        <EmptyState
          title="Todavía no hay negocios"
          description="Creá el primero para empezar a generar tags."
          action={
            <LinkButton href="/app/businesses/new" variant="primary">
              Nuevo negocio
            </LinkButton>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Negocio</Th>
              <Th>Estado</Th>
              <Th>Tags</Th>
              <Th>Scans</Th>
              <Th>Usuarios</Th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => (
              <tr key={business.id}>
                <Td label="Negocio">
                  <Link
                    href={`/app/businesses/${business.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {business.name}
                  </Link>
                  <span className="block text-xs text-muted">{business.slug}</span>
                </Td>
                <Td label="Estado">
                  <Badge tone={business.active ? "success" : "neutral"}>
                    {business.active ? "Activo" : "Inactivo"}
                  </Badge>
                </Td>
                <Td label="Tags" className="tabular-nums">{business._count.tags}</Td>
                <Td label="Scans" className="tabular-nums">
                  {business._count.events.toLocaleString("es-CR")}
                </Td>
                <Td label="Usuarios" className="tabular-nums">{business._count.members}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
