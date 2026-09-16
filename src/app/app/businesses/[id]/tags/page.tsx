import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { ScanEventType } from "@/generated/prisma/enums";
import { requireBusinessAccess } from "@/lib/authz";
import { tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { createTag, toggleTagActive } from "@/server/tag-actions";

export const metadata: Metadata = { title: "Tags del negocio" };

export default async function BusinessTagsPage({
  params,
}: PageProps<"/app/businesses/[id]/tags">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const tags = await prisma.tag.findMany({
    where: { businessId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      locationLabel: true,
      active: true,
      _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {tags.length === 0 ? (
        <EmptyState
          title="Este negocio no tiene tags"
          description="Creá el primero para generar su URL y su QR."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tag</Th>
              <Th>Código</Th>
              <Th>URL</Th>
              <Th>Scans</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <Td label="Tag">
                  <Link
                    href={`/app/tags/${tag.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {tag.name}
                  </Link>
                  {tag.locationLabel ? (
                    <span className="block text-xs text-muted">{tag.locationLabel}</span>
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
                <Td>
                  <form action={toggleTagActive}>
                    <input type="hidden" name="tagId" value={tag.id} />
                    <SubmitButton
                      confirm={
                        tag.active
                          ? `Desactivar "${tag.name}" hará que su landing muestre un aviso. ¿Continuar?`
                          : undefined
                      }
                    >
                      {tag.active ? "Desactivar" : "Activar"}
                    </SubmitButton>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Card className="max-w-xl">
        <h3 className="mb-1 font-medium">Nuevo tag</h3>
        <p className="mb-3 text-sm text-muted">
          El código se genera automáticamente y no se puede elegir.
        </p>

        <ActionForm action={createTag} submitLabel="Crear tag" pendingLabel="Creando…">
          <input type="hidden" name="businessId" value={id} />

          <Field label="Nombre">
            <Input name="name" required maxLength={60} placeholder="Mesa 1" />
          </Field>

          <Field label="Ubicación">
            <Input
              name="locationLabel"
              maxLength={80}
              placeholder="Salón principal"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked />
            Tag activo
          </label>
        </ActionForm>
      </Card>
    </div>
  );
}
