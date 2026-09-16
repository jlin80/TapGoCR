"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";
import { businessFileLinkSchema, firstIssue, formValues } from "@/lib/validation";

/**
 * Alta de un enlace subiendo un archivo (menú en PDF, una imagen) en vez de
 * pegar la URL de algo alojado en otro lado. Comparte permisos con el resto de
 * `link-actions.ts`: el cliente administra los enlaces de su propio negocio.
 */
export async function createUploadedLink(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = businessFileLinkSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí un archivo para subir." };
  }

  const uploaded = await saveUpload(businessId, file);
  if (!uploaded.ok) return { error: uploaded.reason };

  const last = await prisma.businessLink.findFirst({
    where: { businessId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.businessLink.create({
    data: {
      ...parsed.data,
      url: uploaded.url,
      businessId,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/app/businesses/${businessId}`);
  revalidatePath("/client/business");
  return { success: "Archivo subido y enlace agregado." };
}
