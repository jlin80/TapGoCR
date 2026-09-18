import { prisma } from "@/lib/prisma";

/**
 * Galería social ("Seguinos"): fotos que el negocio sube a mano para que su
 * página no dependa de que el visitante se vaya a Instagram/TikTok sin volver
 * (ver el modelo `SocialPost`). No comprueba permisos — misma convención que
 * `src/lib/menu.ts` y `src/lib/analytics.ts`.
 *
 * Una sola función, no una versión pública y otra de administración: a
 * diferencia del menú, una foto no tiene estado oculto/agotado que distinga
 * ambas vistas — lo que ve el negocio en su panel es exactamente lo que ve el
 * cliente final.
 */
export function galleryFor(businessId: string) {
  return prisma.socialPost.findMany({
    where: { businessId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, imageUrl: true, linkUrl: true, platform: true },
  });
}
