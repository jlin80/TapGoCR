"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { resolveImageField } from "@/lib/uploads";
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
 * `businessId` llega del formulario, así que nunca se usa sin validar. El
 * logo y la portada solo se cargan subiendo un archivo (`logoFile`/
 * `coverFile`), nunca pegando una URL — por eso, sin un archivo nuevo,
 * `resolveImageField` tiene que conservar el valor ya guardado (`previous`)
 * y no `parsed.data.logoUrl`, que siempre llega `null` al no existir ese
 * campo en el formulario.
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

  const previous = await prisma.business.findUnique({
    where: { id: businessId },
    select: { logoUrl: true, coverUrl: true },
  });

  const [logo, cover] = await Promise.all([
    resolveImageField(formData, "logoFile", businessId, previous?.logoUrl ?? null, previous?.logoUrl ?? null),
    resolveImageField(formData, "coverFile", businessId, previous?.coverUrl ?? null, previous?.coverUrl ?? null),
  ]);
  if (logo.error) return { error: logo.error };
  if (cover.error) return { error: cover.error };

  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      logoUrl: logo.url,
      coverUrl: cover.url,
      brandColor: parsed.data.brandColor,
      accentColor: parsed.data.accentColor,
      menuMode: parsed.data.menuMode,
      landingTheme: parsed.data.landingTheme,
    },
  });

  revalidateProfile(businessId);
  return { success: "Tu página pública se actualizó." };
}

function revalidateProfile(businessId: string): void {
  revalidatePath("/client/profile");
  revalidatePath("/client/business");
  revalidatePath(`/app/businesses/${businessId}`);
}
