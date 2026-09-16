"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { requireRoot, requireTagAccess } from "@/lib/authz";
import { notifyLogEvent } from "@/lib/discord/events";
import { placaQuotaFor } from "@/lib/chips";
import { generateTagCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { firstIssue, formValues, tagBulkSchema, tagSchema } from "@/lib/validation";

/**
 * Gestión de tags NFC/QR. Crear, renombrar y reasignar son operaciones del
 * equipo de TapGoCR; el cliente solo consulta sus tags y sus estadísticas.
 */
export async function createTag(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = tagSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, plan: true, includedTagsOverride: true },
  });
  if (!business) return { error: "El negocio no existe." };

  const code = await allocateCode();
  if (!code) {
    return { error: "No se pudo generar un código único. Intentá de nuevo." };
  }

  await prisma.tag.create({
    data: { ...parsed.data, businessId, code },
  });

  revalidatePath(`/app/businesses/${businessId}/tags`);
  revalidatePath("/app/tags");
  revalidatePath("/app/dashboard");
  revalidatePath("/client/tags");
  revalidatePath("/client/dashboard");

  // Nunca bloquea la creación: es solo un aviso para conversar el upsell con
  // el cliente si esta placa lo saca de lo incluido en su plan.
  const quota = await placaQuotaFor(business);
  if (quota.level !== "OK") {
    return {
      success: `Tag creado con el código ${code}. Este negocio ya tiene ${quota.activeTags} placas activas de ${quota.limit} incluidas en su plan — es buen momento para ofrecer un upgrade.`,
    };
  }

  return { success: `Tag creado con el código ${code}.` };
}

/**
 * Creación masiva de puntos TapGo, agrupados ("Mesa" × 10 → Mesa 1..Mesa 10
 * en el grupo "Mesas"). Solo ROOT/Admin: el cliente pide puntos vía
 * `/client/requests`, nunca los crea él mismo.
 *
 * Manda un único evento a Discord y una única entrada de auditoría para toda
 * la tanda — diez tags no son diez avisos, son una decisión operativa.
 */
export async function createTagsBulk(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = tagBulkSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, plan: true, includedTagsOverride: true },
  });
  if (!business) return { error: "El negocio no existe." };

  const { groupName, namePrefix, quantity, startIndex, locationLabel } = parsed.data;

  // Se asignan todos los códigos antes de escribir nada: si uno falla a mitad
  // de una tanda de 50, mejor no crear nada que dejar la tanda a medias.
  const codes: string[] = [];
  for (let i = 0; i < quantity; i++) {
    const code = await allocateCode();
    if (!code) {
      return {
        error: "No se pudieron generar códigos únicos para toda la tanda. Probá con una cantidad menor.",
      };
    }
    codes.push(code);
  }

  const groupId = await prisma.$transaction(async (tx) => {
    const group = await tx.pointGroup.upsert({
      where: { businessId_name: { businessId, name: groupName } },
      create: { businessId, name: groupName, locationLabel },
      update: locationLabel ? { locationLabel } : {},
    });

    await tx.tag.createMany({
      data: codes.map((code, index) => ({
        businessId,
        code,
        name: `${namePrefix} ${startIndex + index}`,
        locationLabel,
        pointGroupId: group.id,
        active: true,
      })),
    });

    return group.id;
  });

  revalidatePath(`/app/businesses/${businessId}/tags`);
  revalidatePath("/app/tags");
  revalidatePath("/app/dashboard");
  revalidatePath("/client/tags");
  revalidatePath("/client/dashboard");

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.TAGS_BULK_CREATED,
    entityType: "PointGroup",
    entityId: groupId,
    businessId,
    details: { groupName, namePrefix, quantity, startIndex },
  });

  void notifyLogEvent({
    eventId: `tags-bulk-created:${groupId}:${Date.now()}`,
    action: "Puntos TapGo creados en lote",
    actorEmail: actor.email ?? actor.id,
    details: `${business.name}: ${quantity} puntos "${namePrefix}" en el grupo "${groupName}"`,
  });

  const quota = await placaQuotaFor(business);
  if (quota.level !== "OK") {
    return {
      success: `${quantity} puntos creados en el grupo "${groupName}". Este negocio ya tiene ${quota.activeTags} placas activas de ${quota.limit} incluidas en su plan — es buen momento para ofrecer un upgrade.`,
    };
  }

  return { success: `${quantity} puntos creados en el grupo "${groupName}".` };
}

export async function updateTag(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tagId = String(formData.get("tagId") ?? "");
  if (!tagId) return { error: "Falta el tag." };

  // Renombrar o desactivar un tag es una operación administrativa.
  await requireRoot();
  await requireTagAccess(tagId);

  const parsed = tagSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: parsed.data,
    select: { businessId: true },
  });

  revalidatePath(`/app/businesses/${tag.businessId}/tags`);
  revalidatePath(`/app/tags/${tagId}`);
  revalidatePath("/app/tags");
  return { success: "Tag actualizado." };
}

/**
 * Activa o desactiva un tag. Un tag inactivo muestra el aviso correspondiente
 * en la landing, sin necesidad de reprogramar el NFC.
 */
export async function toggleTagActive(formData: FormData): Promise<void> {
  await requireRoot();

  const tagId = String(formData.get("tagId") ?? "");
  if (!tagId) return;

  await requireTagAccess(tagId);

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { active: true, businessId: true },
  });
  if (!tag) return;

  await prisma.tag.update({
    where: { id: tagId },
    data: { active: !tag.active },
  });

  revalidatePath(`/app/businesses/${tag.businessId}/tags`);
  revalidatePath(`/app/tags/${tagId}`);
  revalidatePath("/app/tags");
}

/**
 * Elimina un tag creado por error.
 *
 * Solo permite borrar si nunca registró un scan/tap: un tag con historial se
 * desactiva (`toggleTagActive`), nunca se borra — perdería su analytics para
 * siempre. Esta es la vía explícita para el caso "lo creé sin querer, nunca
 * se instaló, quiero que desaparezca", no un borrado general.
 */
export async function deleteTag(formData: FormData): Promise<void> {
  await requireRoot();

  const tagId = String(formData.get("tagId") ?? "");
  if (!tagId) return;

  const { businessId } = await requireTagAccess(tagId);

  const eventCount = await prisma.scanEvent.count({ where: { tagId } });
  if (eventCount > 0) return; // Sin feedback textual a propósito: el botón no se muestra en este caso.

  await prisma.tag.delete({ where: { id: tagId } });

  revalidatePath(`/app/businesses/${businessId}/tags`);
  revalidatePath("/app/tags");
  revalidatePath("/app/dashboard");
  revalidatePath("/client/tags");
  revalidatePath("/client/dashboard");
}

/**
 * Reasigna un tag físico a otro negocio.
 *
 * La especificación pide que esto no ocurra sin confirmación administrativa,
 * de ahí el campo `confirm` explícito del formulario.
 */
export async function reassignTag(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRoot();

  const tagId = String(formData.get("tagId") ?? "");
  const targetBusinessId = String(formData.get("targetBusinessId") ?? "");
  const confirmed = formData.get("confirm") === "on";

  if (!tagId || !targetBusinessId) return { error: "Faltan datos." };
  if (!confirmed) {
    return { error: "Confirmá la reasignación para continuar." };
  }

  const target = await prisma.business.findUnique({
    where: { id: targetBusinessId },
    select: { id: true, name: true },
  });
  if (!target) return { error: "El negocio destino no existe." };

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { businessId: true },
  });
  if (!tag) return { error: "El tag no existe." };
  if (tag.businessId === targetBusinessId) {
    return { error: "El tag ya pertenece a ese negocio." };
  }

  // Los eventos históricos se quedan con el negocio anterior: son sus datos, y
  // moverlos falsearía las estadísticas de ambos.
  await prisma.tag.update({
    where: { id: tagId },
    data: { businessId: targetBusinessId },
  });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.TAG_REASSIGNED,
    entityType: "Tag",
    entityId: tagId,
    businessId: targetBusinessId,
    details: { fromBusinessId: tag.businessId, toBusinessId: targetBusinessId },
  });
  void notifyLogEvent({
    eventId: `tag-reassigned:${tagId}:${Date.now()}`,
    action: "Tag reasignado",
    actorEmail: actor.email ?? actor.id,
    details: `${tagId} → ${target.name}`,
  });

  revalidatePath(`/app/businesses/${tag.businessId}/tags`);
  revalidatePath(`/app/businesses/${targetBusinessId}/tags`);
  revalidatePath(`/app/tags/${tagId}`);
  revalidatePath("/app/tags");
  return { success: `Tag reasignado a ${target.name}.` };
}

/**
 * Busca un código libre. La colisión es improbable (30^10 combinaciones), pero
 * se comprueba igual porque el código es único en la base de datos.
 */
async function allocateCode(attempts = 5): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const code = generateTagCode();
    const existing = await prisma.tag.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return null;
}
