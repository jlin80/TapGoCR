"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteUploadIfOwned, saveUpload } from "@/lib/uploads";
import { firstIssue, formValues, socialPostSchema } from "@/lib/validation";

/**
 * Galería social ("Seguinos"). Solo el propio negocio la administra — mismo
 * criterio que `menu-actions.ts` y `link-actions.ts`: toda entrada pasa por
 * `requireBusinessAccess`.
 */

export async function createSocialPost(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = socialPostSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una foto para subir." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Subí una imagen: JPG, PNG o WEBP." };
  }

  const uploaded = await saveUpload(businessId, file);
  if (!uploaded.ok) return { error: uploaded.reason };

  const last = await prisma.socialPost.findFirst({
    where: { businessId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.socialPost.create({
    data: {
      businessId,
      imageUrl: uploaded.url,
      linkUrl: parsed.data.linkUrl,
      platform: parsed.data.platform,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidateGallery(businessId);
  return { success: "Foto agregada a la galería." };
}

export async function deleteSocialPost(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { businessId: true, imageUrl: true },
  });
  if (!post) return;

  await requireBusinessAccess(post.businessId);

  await prisma.socialPost.delete({ where: { id: postId } });
  await deleteUploadIfOwned(post.imageUrl);

  revalidateGallery(post.businessId);
}

export async function moveSocialPost(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!postId || (direction !== "up" && direction !== "down")) return;

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { id: true, businessId: true, position: true },
  });
  if (!post) return;

  await requireBusinessAccess(post.businessId);

  const neighbour = await prisma.socialPost.findFirst({
    where: {
      businessId: post.businessId,
      position: direction === "up" ? { lt: post.position } : { gt: post.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
    select: { id: true, position: true },
  });
  if (!neighbour) return;

  // En una transacción para que un fallo a mitad no deje dos fotos
  // compartiendo posición. Mismo criterio que `moveMenuCategory`/`moveLink`.
  await prisma.$transaction([
    prisma.socialPost.update({ where: { id: post.id }, data: { position: neighbour.position } }),
    prisma.socialPost.update({ where: { id: neighbour.id }, data: { position: post.position } }),
  ]);

  revalidateGallery(post.businessId);
}

function revalidateGallery(businessId: string): void {
  revalidatePath("/client/gallery");
  revalidatePath(`/app/businesses/${businessId}`);
}
