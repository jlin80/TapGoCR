"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { domainSchema, firstIssue, formValues, serviceSchema } from "@/lib/validation";

/**
 * Servicios contratados y dominios.
 *
 * Ambos son registros administrativos: TapGoCR gestiona el trámite fuera de la
 * plataforma y aquí solo deja constancia del estado. No hay compra automática
 * de dominios ni se guardan credenciales del registrador.
 */
export async function createService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = serviceSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return { error: "El negocio no existe." };

  await prisma.businessService.create({ data: { ...parsed.data, businessId } });

  revalidateServices(businessId);
  return { success: "Servicio registrado." };
}

export async function updateService(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) return { error: "Falta el servicio." };

  const parsed = serviceSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const service = await prisma.businessService.update({
    where: { id: serviceId },
    data: parsed.data,
    select: { businessId: true },
  });

  revalidateServices(service.businessId);
  return { success: "Servicio actualizado." };
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireRoot();

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) return;

  const service = await prisma.businessService.findUnique({
    where: { id: serviceId },
    select: { businessId: true },
  });
  if (!service) return;

  await prisma.businessService.delete({ where: { id: serviceId } });
  revalidateServices(service.businessId);
}

// ---------------------------------------------------------------------------
// Dominios
// ---------------------------------------------------------------------------

export async function createDomain(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  const parsed = domainSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.domain.findUnique({
    where: { domain: parsed.data.domain },
    select: { id: true },
  });
  if (taken) return { error: "Ese dominio ya está registrado en la plataforma." };

  await prisma.domain.create({ data: { ...parsed.data, businessId } });

  revalidateDomains(businessId);
  return { success: "Dominio registrado." };
}

export async function updateDomain(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const domainId = String(formData.get("domainId") ?? "");
  if (!domainId) return { error: "Falta el dominio." };

  const parsed = domainSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const taken = await prisma.domain.findUnique({
    where: { domain: parsed.data.domain },
    select: { id: true },
  });
  if (taken && taken.id !== domainId) {
    return { error: "Ese dominio ya está registrado en la plataforma." };
  }

  const domain = await prisma.domain.update({
    where: { id: domainId },
    data: parsed.data,
    select: { businessId: true },
  });

  revalidateDomains(domain.businessId);
  return { success: "Dominio actualizado." };
}

export async function deleteDomain(formData: FormData): Promise<void> {
  await requireRoot();

  const domainId = String(formData.get("domainId") ?? "");
  if (!domainId) return;

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: { businessId: true },
  });
  if (!domain) return;

  await prisma.domain.delete({ where: { id: domainId } });
  revalidateDomains(domain.businessId);
}

function revalidateServices(businessId: string): void {
  revalidatePath(`/app/businesses/${businessId}/services`);
  revalidatePath("/app/services");
}

function revalidateDomains(businessId: string): void {
  revalidatePath(`/app/businesses/${businessId}/domains`);
  revalidatePath("/app/domains");
}
