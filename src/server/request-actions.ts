"use server";

import { revalidatePath } from "next/cache";

import { RequestPriority, RequestStatus } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { requireRoot, requireBusinessAccess } from "@/lib/authz";
import { emitRequestStatusChanged, emitSupportRequest } from "@/lib/notifications/dispatch";
import { prisma } from "@/lib/prisma";
import {
  clientRequestSchema,
  firstIssue,
  formValues,
  serviceRequestSchema,
} from "@/lib/validation";

/**
 * Solicitudes de servicio (dominio, website, hosting, mantenimiento…).
 *
 * El cliente puede abrirlas para su propio negocio; el estado y la prioridad
 * los administra únicamente el equipo de TapGoCR.
 */
export async function createRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = serviceRequestSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return { error: "El negocio no existe." };

  await prisma.serviceRequest.create({ data: { ...parsed.data, businessId } });

  revalidatePath("/app/requests");
  return { success: "Solicitud creada." };
}

/** Alta desde el panel del cliente: entra siempre como NEW y prioridad normal. */
export async function createClientRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = clientRequestSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const request = await prisma.serviceRequest.create({
    data: {
      ...parsed.data,
      businessId,
      status: RequestStatus.NEW,
      priority: RequestPriority.NORMAL,
    },
    select: {
      id: true,
      title: true,
      type: true,
      priority: true,
      business: { select: { name: true, owner: { select: { email: true } } } },
    },
  });

  // Después de que la solicitud ya se guardó: si Discord o el correo fallan,
  // la solicitud igual existe y se ve en el panel. Nunca al revés.
  void emitSupportRequest({
    eventId: `service-request-created:${request.id}`,
    requestId: request.id,
    businessId,
    businessName: request.business.name,
    businessEmail: request.business.owner?.email ?? null,
    title: request.title,
    type: request.type,
    priority: request.priority,
  });

  revalidatePath("/app/requests");
  revalidatePath("/client/requests");
  return { success: "Solicitud enviada. El equipo de TapGoCR te contactará." };
}

export async function updateRequest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { error: "Falta la solicitud." };

  const parsed = serviceRequestSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: parsed.data,
    select: { businessId: true },
  });

  revalidatePath("/app/requests");
  revalidatePath(`/app/businesses/${request.businessId}`);
  revalidatePath("/client/requests");
  return { success: "Solicitud actualizada." };
}

/** Atajo para mover una solicitud de estado desde la lista. */
export async function advanceRequestStatus(formData: FormData): Promise<void> {
  await requireRoot();

  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!requestId) return;

  if (!Object.values(RequestStatus).includes(status as RequestStatus)) return;

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status: status as RequestStatus },
    select: {
      title: true,
      business: { select: { id: true, name: true, owner: { select: { email: true } } } },
    },
  });

  void emitRequestStatusChanged({
    eventId: `request-status-changed:${requestId}:${status}`,
    requestId,
    businessId: request.business.id,
    businessName: request.business.name,
    businessEmail: request.business.owner?.email ?? null,
    title: request.title,
    status,
  });

  revalidatePath("/app/requests");
  revalidatePath("/client/requests");
}
