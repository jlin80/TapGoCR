import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Textarea,
} from "@/components/ui";
import { ChipModel, ChipStatus } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import { CHIP_MODEL_LABELS, CHIP_STATUS_LABELS, CHIP_STATUS_TONES } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { assignChip, deleteChip, registerChip, updateChip } from "@/server/chip-actions";

export const metadata: Metadata = { title: "Chips" };

/**
 * Inventario de chips físicos.
 *
 * Es solo hardware: uid, modelo, estado y a qué tag está programado. La cuota
 * de taps es del plan de suscripción del negocio, no de acá — se ve y se
 * cambia desde la ficha del negocio.
 */
export default async function ChipsPage() {
  await requireRoot();

  const [chips, tags] = await Promise.all([
    prisma.chip.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        uid: true,
        model: true,
        status: true,
        batch: true,
        notes: true,
        tag: {
          select: {
            id: true,
            name: true,
            code: true,
            business: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.tag.findMany({
      orderBy: [{ business: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        business: { select: { name: true } },
        chip: { select: { id: true } },
      },
    }),
  ]);

  const inStock = chips.filter((row) => row.status === ChipStatus.IN_STOCK).length;
  const installed = chips.filter((row) => row.status === ChipStatus.INSTALLED).length;

  // Un tag admite un solo chip, así que los ocupados no se ofrecen.
  const freeTags = tags.filter((tag) => !tag.chip);

  return (
    <>
      <PageHeader
        title="Chips"
        description="Inventario del hardware NFC."
      />

      <div className="mb-8 stat-rail">
        <StatCard label="Chips registrados" value={chips.length} />
        <StatCard label="En stock" value={inStock} />
        <StatCard label="Instalados" value={installed} />
      </div>

      <div className="flex flex-col gap-6">
        {chips.length === 0 ? (
          <EmptyState
            title="Todavía no registraste ningún chip"
            description="Anotá cada chip al recibirlo, antes de programarlo."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {chips.map((chip) => (
              <li key={chip.id}>
                <Card className="p-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                      <span className="font-mono text-sm font-medium">{chip.uid}</span>
                      <Badge tone={CHIP_STATUS_TONES[chip.status]}>
                        {CHIP_STATUS_LABELS[chip.status]}
                      </Badge>

                      <span className="min-w-0 flex-1 truncate text-xs text-muted">
                        {chip.tag
                          ? `${chip.tag.business.name} · ${chip.tag.name}`
                          : "Sin asignar"}
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-muted transition-transform group-open:rotate-90"
                      >
                        &rsaquo;
                      </span>
                    </summary>

                    <div className="flex flex-col gap-5 border-t border-border px-4 py-4">
                      {chip.tag ? (
                        <p className="text-xs text-muted">
                          <Link
                            href={`/app/tags/${chip.tag.id}`}
                            className="text-brand hover:underline"
                          >
                            Ver el tag {chip.tag.code}
                          </Link>
                          {" · "}
                          <Link
                            href={`/app/clients/${chip.tag.business.id}`}
                            className="text-brand hover:underline"
                          >
                            Ver plan y cuota de {chip.tag.business.name}
                          </Link>
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <form action={deleteChip}>
                          <input type="hidden" name="chipId" value={chip.id} />
                          <SubmitButton
                            variant="danger"
                            confirm={`¿Eliminar el chip ${chip.uid} del inventario?`}
                          >
                            Eliminar
                          </SubmitButton>
                        </form>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div>
                          <h4 className="mb-3 text-sm font-semibold">Datos del chip</h4>
                          <ActionForm action={updateChip} submitLabel="Guardar">
                            <input type="hidden" name="chipId" value={chip.id} />
                            <ChipFields chip={chip} />
                          </ActionForm>
                        </div>

                        <div>
                          <h4 className="mb-3 text-sm font-semibold">
                            Tag al que está programado
                          </h4>
                          <ActionForm action={assignChip} submitLabel="Asociar">
                            <input type="hidden" name="chipId" value={chip.id} />
                            <Field
                              label="Tag"
                              hint="Dejalo vacío para liberar el chip y devolverlo a stock."
                            >
                              <Select name="tagId" defaultValue={chip.tag?.id ?? ""}>
                                <option value="">Sin asignar</option>
                                {chip.tag ? (
                                  <option value={chip.tag.id}>
                                    {chip.tag.business.name} — {chip.tag.name} (
                                    {chip.tag.code})
                                  </option>
                                ) : null}
                                {freeTags.map((tag) => (
                                  <option key={tag.id} value={tag.id}>
                                    {tag.business.name} — {tag.name} ({tag.code})
                                  </option>
                                ))}
                              </Select>
                            </Field>
                          </ActionForm>
                        </div>
                      </div>
                    </div>
                  </details>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Card className="max-w-2xl">
          <h3 className="mb-1 font-medium">Registrar un chip</h3>
          <p className="mb-3 text-sm text-muted">Anotá el UID que trae grabado el chip.</p>

          <ActionForm action={registerChip} submitLabel="Registrar chip">
            <ChipFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

type ChipRow = {
  uid: string;
  model: ChipModel;
  status: ChipStatus;
  batch: string | null;
  notes: string | null;
};

function ChipFields({ chip }: { chip?: ChipRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="UID" hint="Hexadecimal. Se admiten dos puntos o guiones.">
        <Input
          name="uid"
          required
          maxLength={32}
          defaultValue={chip?.uid}
          placeholder="04A2B3C4D5E6F0"
          className="font-mono"
        />
      </Field>

      <Field label="Modelo">
        <Select name="model" defaultValue={chip?.model ?? ChipModel.NTAG215}>
          {Object.values(ChipModel).map((model) => (
            <option key={model} value={model}>
              {CHIP_MODEL_LABELS[model]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Estado">
        <Select name="status" defaultValue={chip?.status ?? ChipStatus.IN_STOCK}>
          {Object.values(ChipStatus).map((status) => (
            <option key={status} value={status}>
              {CHIP_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Lote" hint="Para agrupar una compra.">
        <Input name="batch" maxLength={60} defaultValue={chip?.batch ?? ""} />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Notas">
          <Textarea name="notes" maxLength={1000} defaultValue={chip?.notes ?? ""} />
        </Field>
      </div>
    </div>
  );
}
