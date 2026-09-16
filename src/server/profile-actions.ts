"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadIfOwned, saveUpload } from "@/lib/uploads";
import { firstIssue, formValues, publicProfileSchema } from "@/lib/validation";

/**
 * Presentación de la landing pública, administrada por el propio negocio.
 *
 * Es la contraparte de `updateBusiness` (ROOT) para los campos cosméticos. La
 * separación no es estética: `businessSchema` incluye `slug`, `active` y los
 * datos de contacto que administra TapGoCR, y dejar que un cliente enviara ese
 * formulario le permitiría desactivar su propio negocio o chocar el slug de
 * otro. `publicProfileSchema` acota exactamente lo que puede tocar, y el
 * `update` se arma solo con esas claves.
 *
 * `requireBusinessAccess` es lo que impide tocar el perfil de otro negocio: el
 * `businessId` llega del formulario, así que nunca se usa sin validar.
 */
export async function updatePublicProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = publicProfileSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      logoUrl: parsed.data.logoUrl,
      coverUrl: parsed.data.coverUrl,
      brandColor: parsed.data.brandColor,
      accentColor: parsed.data.accentColor,
      menuMode: parsed.data.menuMode,
      landingTheme: parsed.data.landingTheme,
    },
  });

  revalidateProfile(businessId);
  return { success: "Tu página pública se actualizó." };
}

/**
 * Sube el logo o la portada como archivo, en vez de pegar la URL de una
 * imagen alojada en otro lado. Reemplaza al que hubiera y, si el anterior
 * también era un archivo subido a TapGoCR, lo borra del disco: si no, cada
 * cambio de logo dejaría un huérfano acumulándose en `uploads/`.
 */
export async function uploadProfileImage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const field = String(formData.get("field") ?? "");
  if (field !== "logo" && field !== "cover") return { error: "Campo inválido." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una imagen para subir." };
  }
  // `saveUpload` es genérico (también sirve un menú en PDF): acá se acota a
  // imágenes, porque un logo o una portada apuntando a un PDF rompe la landing.
  if (!file.type.startsWith("image/")) {
    return { error: "Subí una imagen: JPG, PNG o WEBP." };
  }

  const uploaded = await saveUpload(businessId, file);
  if (!uploaded.ok) return { error: uploaded.reason };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { logoUrl: true, coverUrl: true },
  });

  const previousUrl = field === "logo" ? business?.logoUrl : business?.coverUrl;
  if (previousUrl) await deleteUploadIfOwned(previousUrl);

  await prisma.business.update({
    where: { id: businessId },
    data: field === "logo" ? { logoUrl: uploaded.url } : { coverUrl: uploaded.url },
  });

  revalidateProfile(businessId);
  return { success: field === "logo" ? "Logo actualizado." : "Portada actualizada." };
}

function revalidateProfile(businessId: string): void {
  revalidatePath("/client/profile");
  revalidatePath("/client/business");
  revalidatePath(`/app/businesses/${businessId}`);
}
