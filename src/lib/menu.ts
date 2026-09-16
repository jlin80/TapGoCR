import { prisma } from "@/lib/prisma";

/**
 * Menú digital nativo.
 *
 * Ninguna de estas funciones comprueba permisos: la versión pública se resuelve
 * desde el código del tag y la de administración se llama después de pasar por
 * `requireBusinessAccess`. Misma convención que `src/lib/analytics.ts`.
 */

/** El menú tal como lo ve el cliente final: solo lo publicado y disponible. */
export function publicMenu(businessId: string) {
  return prisma.menuCategory.findMany({
    where: {
      businessId,
      active: true,
      // Una categoría sin productos disponibles no aporta nada y deja un hueco
      // en la carta, así que no se trae.
      items: { some: { available: true } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      items: {
        where: { available: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          imageUrl: true,
          featured: true,
        },
      },
    },
  });
}

/** Productos destacados, de cualquier categoría, para la sección "Destacados". */
export function publicFeaturedItems(businessId: string) {
  return prisma.menuItem.findMany({
    where: {
      featured: true,
      available: true,
      category: { businessId, active: true },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, description: true, priceCents: true, imageUrl: true },
    take: 6,
  });
}

/** El menú completo para el editor: incluye lo oculto y lo agotado. */
export function manageableMenu(businessId: string) {
  return prisma.menuCategory.findMany({
    where: { businessId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      active: true,
      items: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          imageUrl: true,
          available: true,
          featured: true,
        },
      },
    },
  });
}

/** ¿Hay algo publicado? Decide si el botón "Ver menú" nativo tiene sentido. */
export async function hasPublishedMenu(businessId: string): Promise<boolean> {
  const category = await prisma.menuCategory.findFirst({
    where: { businessId, active: true, items: { some: { available: true } } },
    select: { id: true },
  });

  return category !== null;
}
