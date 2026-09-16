"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { requireRoot } from "@/lib/authz";
import { notifyAdminAction } from "@/lib/discord/events";
import { emitPlanChanged } from "@/lib/notifications/dispatch";
import { prisma } from "@/lib/prisma";
import { businessNameTaken, NameConflictError, withNameLock } from "@/lib/uniqueness";
import { businessSchema, firstIssue, formValues } from "@/lib/validation";

/**
 * Alta y edición de negocios. Solo el equipo de TapGoCR: un cliente no puede
 * crear negocios ni modificar los datos comerciales del suyo.
 */
export async function createBusiness(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = businessSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.business.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (taken) return { error: "Ya existe un negocio con ese identificador." };

  let businessId: string;
  try {
    businessId = await withNameLock(parsed.data.name, async (tx) => {
      if (await businessNameTaken(parsed.data.name, undefined, undefined, tx)) {
        throw new NameConflictError("Ya existe un negocio con ese nombre.");
      }

      const business = await tx.business.create({
        data: parsed.data,
        select: { id: true },
      });
      return business.id;
    });
  } catch (error) {
    if (error instanceof NameConflictError) return { error: error.message };
    throw error;
  }

  revalidatePath("/app/businesses");
  redirect(`/app/businesses/${businessId}`);
}

export async function updateBusiness(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = businessSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.business.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (taken && taken.id !== businessId) {
    return { error: "Ya existe otro negocio con ese identificador." };
  }

  if (await businessNameTaken(parsed.data.name, businessId)) {
    return { error: "Ya existe otro negocio con ese nombre." };
  }

  // Se lee antes del `update`: es la única forma de saber si el plan
  // realmente cambió, y de qué a qué, para dejarlo en la bitácora.
  const previous = await prisma.business.findUnique({
    where: { id: businessId },
    select: { plan: true },
  });

  await prisma.business.update({ where: { id: businessId }, data: parsed.data });

  if (previous && previous.plan !== parsed.data.plan) {
    await recordAudit({
      actor,
      action: AUDIT_ACTIONS.BUSINESS_PLAN_CHANGED,
      entityType: "Business",
      entityId: businessId,
      businessId,
      details: { from: previous.plan, to: parsed.data.plan },
    });
    void emitPlanChanged({
      eventId: `business-plan-changed:${businessId}:${Date.now()}`,
      businessId,
      businessName: parsed.data.name,
      fromPlan: previous.plan,
      toPlan: parsed.data.plan,
    });
  }

  revalidatePath("/app/businesses");
  revalidatePath(`/app/businesses/${businessId}`);
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${businessId}`);
  revalidatePath("/client/dashboard");
  revalidatePath("/client/tags");
  return { success: "Negocio actualizado." };
}

/**
 * Desactiva o reactiva un negocio. Desactivarlo apaga todas sus landings sin
 * borrar nada: los tags físicos siguen instalados y se pueden reactivar.
 */
export async function toggleBusinessActive(formData: FormData): Promise<void> {
  const actor = await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { active: true },
  });
  if (!business) return;

  await prisma.business.update({
    where: { id: businessId },
    data: { active: !business.active },
  });

  // Base del cálculo de churn/reactivación en las métricas de ROOT: sin esta
  // marca no hay forma honesta de saber cuándo se cortó un cliente.
  await recordAudit({
    actor,
    action: business.active
      ? AUDIT_ACTIONS.BUSINESS_DEACTIVATED
      : AUDIT_ACTIONS.BUSINESS_REACTIVATED,
    entityType: "Business",
    entityId: businessId,
    businessId,
  });
  void notifyAdminAction({
    eventId: `business-toggle:${businessId}:${Date.now()}`,
    action: business.active ? "Negocio desactivado" : "Negocio reactivado",
    actorEmail: actor.email ?? actor.id,
    details: businessId,
  });

  revalidatePath("/app/businesses");
  revalidatePath(`/app/businesses/${businessId}`);
  revalidatePath("/app/metrics");
}
