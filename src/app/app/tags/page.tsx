import type { Metadata } from "next";
import Link from "next/link";

import { Badge, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { ScanEventType } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import { tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  await requireRoot();

  const tags = await prisma.tag.findMany({
    orderBy: [{ business: { name: "asc" } }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      active: true,
      business: { select: { id: true, name: true } },
      _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Tags"
        description="Todos los tags NFC/QR emitidos por TapGoCR."
      />

      {tags.length === 0 ? (
        <EmptyState
          title="Todavía no hay tags"
          description="Los tags se crean desde la ficha de cada negocio."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tag</Th>
              <Th>Negocio</Th>
              <Th>Código</Th>
              <Th>URL</Th>
              <Th>Scans</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <Td label="Tag">
                  <Link href={`/app/tags/${tag.id}`} className="font-medium hover:text-brand">
                    {tag.name}
                  </Link>
                </Td>
                <Td label="Negocio">
                  <Link
                    href={`/app/businesses/${tag.business.id}`}
                    className="hover:text-brand"
                  >
                    {tag.business.name}
                  </Link>
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
    </>
  );
}
