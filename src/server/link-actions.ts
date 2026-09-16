"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadIfOwned } from "@/lib/uploads";
import { businessLinkSchema, firstIssue, formValues } from "@/lib/validation";

/**
 * Enlaces de la landing.
 *
 * A diferencia del resto de la administración, estas acciones sí las puede
 * ejecutar el cliente: administrar sus propios enlaces es parte de lo que
 * contrata. `requireBusinessAccess` es lo que impide tocar los de otro negocio.
 */
export async function createLink(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = businessLinkSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const last = await prisma.businessLink.findFirst({
    where: { businessId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.businessLink.create({
    data: {
      ...parsed.data,
      businessId,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidateLinks(businessId);
  return { success: "Enlace agregado." };
}

export async function updateLink(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return { error: "Falta el enlace." };

  const link = await prisma.businessLink.findUnique({
    where: { id: linkId },
    select: { businessId: true, url: true },
  });
  if (!link) return { error: "El enlace no existe." };

  await requireBusinessAccess(link.businessId);

  const parsed = businessLinkSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await prisma.businessLink.update({
    where: { id: linkId },
    // `position` se administra con las acciones de orden, no con este formulario.
    data: {
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      active: parsed.data.active,
    },
  });

  // Si la URL apuntaba a un archivo subido y cambió, ese archivo queda huérfano:
  // nadie más lo referencia, así que se borra en vez de acumularlo en disco.
  if (link.url !== parsed.data.url) {
    await deleteUploadIfOwned(link.url);
  }

  revalidateLinks(link.businessId);
  return { success: "Enlace actualizado." };
}

export async function deleteLink(formData: FormData): Promise<void> {
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;

  const link = await prisma.businessLink.findUnique({
    where: { id: linkId },
    select: { businessId: true, url: true },
  });
  if (!link) return;

  await requireBusinessAccess(link.businessId);
  await prisma.businessLink.delete({ where: { id: linkId } });
  await deleteUploadIfOwned(link.url);

  revalidateLinks(link.businessId);
}

/**
 * Sube o baja un enlace intercambiando su posición con el vecino.
 *
 * Se hace dentro de una transacción para que un fallo a mitad no deje dos
 * enlaces compartiendo la misma posición.
 */
export async function moveLink(formData: FormData): Promise<void> {
  const linkId = String(formData.get("linkId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!linkId || (direction !== "up" && direction !== "down")) return;

  const link = await prisma.businessLink.findUnique({
    where: { id: linkId },
    select: { id: true, businessId: true, position: true },
  });
  if (!link) return;

  await requireBusinessAccess(link.businessId);

  const neighbour = await prisma.businessLink.findFirst({
    where: {
      businessId: link.businessId,
      position:
        direction === "up" ? { lt: link.position } : { gt: link.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
    select: { id: true, position: true },
  });

  if (!neighbour) return;

  await prisma.$transaction([
    prisma.businessLink.update({
      where: { id: link.id },
      data: { position: neighbour.position },
    }),
    prisma.businessLink.update({
      where: { id: neighbour.id },
      data: { position: link.position },
    }),
  ]);

  revalidateLinks(link.businessId);
}

function revalidateLinks(businessId: string): void {
  revalidatePath(`/app/businesses/${businessId}`);
  revalidatePath("/client/business");
}
