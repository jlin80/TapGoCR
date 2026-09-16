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
import { createTag, createTagsBulk, deleteTag, toggleTagActive } from "@/server/tag-actions";

export const metadata: Metadata = { title: "Tags del negocio" };

export default async function BusinessTagsPage({
  params,
}: PageProps<"/app/businesses/[id]/tags">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const [tags, eventCounts] = await Promise.all([
    prisma.tag.findMany({
      where: { businessId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        locationLabel: true,
        active: true,
        pointGroup: { select: { id: true, name: true } },
        _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
      },
    }),
    // Total sin filtrar (no solo scans QR): un tag recién creado por error
    // nunca tuvo NINGÚN evento, ni siquiera un tap NFC de prueba.
    prisma.scanEvent.groupBy({ by: ["tagId"], where: { businessId: id }, _count: true }),
  ]);
  const totalEventsByTag = new Map(eventCounts.map((row) => [row.tagId, row._count]));

  // Agrupados por PointGroup para producción; "Sin grupo" cubre todo lo
  // creado antes de que existiera el modelo, sin perder ni un tag de vista.
  const groups = new Map<string, { id: string | null; name: string; tags: typeof tags }>();
  for (const tag of tags) {
    const key = tag.pointGroup?.id ?? "__none__";
    if (!groups.has(key)) {
      groups.set(key, { id: tag.pointGroup?.id ?? null, name: tag.pointGroup?.name ?? "Sin grupo", tags: [] });
    }
    groups.get(key)!.tags.push(tag);
  }

  function TagsTable({ rows }: { rows: typeof tags }) {
    return (
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
          {rows.map((tag) => (
            <tr key={tag.id}>
              <Td label="Tag">
                <Link href={`/app/tags/${tag.id}`} className="font-medium hover:text-brand">
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
                <div className="flex flex-wrap gap-2">
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
                  {!totalEventsByTag.get(tag.id) ? (
                    <form action={deleteTag}>
                      <input type="hidden" name="tagId" value={tag.id} />
                      <SubmitButton
                        variant="danger"
                        confirm={`¿Eliminar "${tag.name}"? Nunca registró actividad, no se pierde historial. No se puede deshacer.`}
                      >
                        Eliminar
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {tags.length === 0 ? (
        <EmptyState
          title="Este negocio no tiene tags"
          description="Creá el primero para generar su URL y su QR."
        />
      ) : (
        [...groups.values()].map((group) => (
          <div key={group.id ?? "__none__"}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {group.name} · {group.tags.length}
              </h3>
              {group.id ? (
                <Link
                  href={`/app/businesses/${id}/tags/print?group=${group.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Imprimir QR del grupo →
                </Link>
              ) : null}
            </div>
            <TagsTable rows={group.tags} />
          </div>
        ))
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 font-medium">Nuevo tag individual</h3>
          <p className="mb-3 text-sm text-muted">
            El código se genera automáticamente y no se puede elegir.
          </p>

          <ActionForm action={createTag} submitLabel="Crear tag" pendingLabel="Creando…">
            <input type="hidden" name="businessId" value={id} />

            <Field label="Nombre">
              <Input name="name" required maxLength={60} placeholder="Mesa 1" />
            </Field>

            <Field label="Ubicación">
              <Input name="locationLabel" maxLength={80} placeholder="Salón principal" />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="active" defaultChecked />
              Tag activo
            </label>
          </ActionForm>
        </Card>

        <Card>
          <h3 className="mb-1 font-medium">Crear puntos TapGo en lote</h3>
          <p className="mb-3 text-sm text-muted">
            &ldquo;Mesa&rdquo; × 10 crea Mesa 1 a Mesa 10, todos en el mismo grupo. Cada uno
            recibe su propio código y QR; todos abren la misma página del negocio.
          </p>

          <ActionForm
            action={createTagsBulk}
            submitLabel="Crear puntos"
            pendingLabel="Creando…"
          >
            <input type="hidden" name="businessId" value={id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Grupo" hint="Ej. Mesas, Entrada, Recepción.">
                <Input name="groupName" required maxLength={60} placeholder="Mesas" />
              </Field>

              <Field label="Nombre base" hint="Se numera automáticamente.">
                <Input name="namePrefix" required maxLength={40} placeholder="Mesa" />
              </Field>

              <Field label="Cantidad">
                <Input
                  name="quantity"
                  type="number"
                  required
                  min={1}
                  max={50}
                  defaultValue={10}
                />
              </Field>

              <Field label="Empieza en">
                <Input name="startIndex" type="number" min={1} defaultValue={1} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Ubicación" hint="Opcional, aplica a todos los del lote.">
                  <Input name="locationLabel" maxLength={80} placeholder="Salón principal" />
                </Field>
              </div>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
