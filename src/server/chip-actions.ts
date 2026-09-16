"use server";

import { revalidatePath } from "next/cache";

import { ChipStatus } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { chipAssignSchema, chipSchema, firstIssue, formValues } from "@/lib/validation";

/**
 * Inventario de chips físicos. Todo esto es exclusivo de ROOT: el cliente ve
 * sus chips, pero no puede registrarlos ni moverlos. El tope de placas es del
 * plan de suscripción del negocio, no de estos chips — se administra desde la
 * ficha del negocio. Los taps siempre son ilimitados.
 */
export async function registerChip(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = chipSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.chip.findUnique({
    where: { uid: parsed.data.uid },
    select: { id: true },
  });
  if (taken) return { error: `El chip ${parsed.data.uid} ya está registrado.` };

  await prisma.chip.create({ data: parsed.data });

  revalidateChips();
  return { success: `Chip ${parsed.data.uid} registrado.` };
}

export async function updateChip(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const chipId = String(formData.get("chipId") ?? "");
  if (!chipId) return { error: "Falta el chip." };

  const parsed = chipSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.chip.findUnique({
    where: { uid: parsed.data.uid },
    select: { id: true },
  });
  if (taken && taken.id !== chipId) {
    return { error: `El chip ${parsed.data.uid} ya está registrado.` };
  }

  await prisma.chip.update({ where: { id: chipId }, data: parsed.data });

  revalidateChips();
  return { success: "Chip actualizado." };
}

/**
 * Asocia el chip al tag que tiene programado, o lo libera.
 *
 * Un tag admite un solo chip: si se reemplaza una placa dañada, el chip
 * anterior queda liberado y marcado como retirado, conservando su historial.
 */
export async function assignChip(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = chipAssignSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { chipId, tagId } = parsed.data;

  const chip = await prisma.chip.findUnique({
    where: { id: chipId },
    select: { id: true, uid: true },
  });
  if (!chip) return { error: "El chip no existe." };

  if (!tagId) {
    await prisma.chip.update({
      where: { id: chipId },
      data: { tagId: null, status: ChipStatus.IN_STOCK },
    });
    revalidateChips();
    return { success: `Chip ${chip.uid} liberado y devuelto a stock.` };
  }

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true, name: true, chip: { select: { id: true, uid: true } } },
  });
  if (!tag) return { error: "El tag no existe." };

  if (tag.chip && tag.chip.id !== chipId) {
    return {
      error: `El tag "${tag.name}" ya tiene el chip ${tag.chip.uid}. Liberalo primero.`,
    };
  }

  await prisma.chip.update({
    where: { id: chipId },
    data: { tagId, status: ChipStatus.INSTALLED },
  });

  revalidateChips();
  return { success: `Chip ${chip.uid} asociado a "${tag.name}".` };
}

export async function deleteChip(formData: FormData): Promise<void> {
  await requireRoot();

  const chipId = String(formData.get("chipId") ?? "");
  if (!chipId) return;

  await prisma.chip.delete({ where: { id: chipId } });
  revalidateChips();
}

function revalidateChips(): void {
  revalidatePath("/app/chips");
  revalidatePath("/app/dashboard");
  revalidatePath("/client/tags");
  revalidatePath("/client/dashboard");
}
