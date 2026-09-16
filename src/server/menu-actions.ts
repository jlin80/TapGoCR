"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { requireBusinessAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  firstIssue,
  formValues,
  menuCategorySchema,
  menuItemSchema,
} from "@/lib/validation";

/**
 * Menú digital nativo.
 *
 * Igual que los enlaces de la landing, esto sí lo administra el cliente: es
 * parte de lo que contrata. Toda entrada pasa por `requireBusinessAccess`.
 *
 * Los productos cuelgan de una categoría, no del negocio, así que su dueño se
 * resuelve subiendo por la relación. `categoryOwner` centraliza ese paso para
 * que ninguna acción caiga en el patrón "buscar por id y confiar".
 */

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export async function createMenuCategory(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Falta el negocio." };

  await requireBusinessAccess(businessId);

  const parsed = menuCategorySchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const last = await prisma.menuCategory.findFirst({
    where: { businessId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.menuCategory.create({
    data: { ...parsed.data, businessId, position: (last?.position ?? -1) + 1 },
  });

  revalidateMenu(businessId);
  return { success: `Categoría "${parsed.data.name}" agregada.` };
}

export async function updateMenuCategory(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return { error: "Falta la categoría." };

  const businessId = await categoryOwner(categoryId);
  if (!businessId) return { error: "La categoría no existe." };

  const parsed = menuCategorySchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await prisma.menuCategory.update({
    where: { id: categoryId },
    // `position` se administra con `moveMenuCategory`, no con este formulario.
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      active: parsed.data.active,
    },
  });

  revalidateMenu(businessId);
  return { success: "Categoría actualizada." };
}

/**
 * Elimina la categoría y, en cascada, sus productos.
 *
 * Es la única operación destructiva del menú y por eso el formulario pide
 * confirmación. No hay papelera: un menú es contenido que el negocio vuelve a
 * cargar, no un historial que deba preservarse.
 */
export async function deleteMenuCategory(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return;

  const businessId = await categoryOwner(categoryId);
  if (!businessId) return;

  await prisma.menuCategory.delete({ where: { id: categoryId } });
  revalidateMenu(businessId);
}

export async function moveMenuCategory(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!categoryId || (direction !== "up" && direction !== "down")) return;

  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, businessId: true, position: true },
  });
  if (!category) return;

  await requireBusinessAccess(category.businessId);

  const neighbour = await prisma.menuCategory.findFirst({
    where: {
      businessId: category.businessId,
      position:
        direction === "up" ? { lt: category.position } : { gt: category.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
    select: { id: true, position: true },
  });
  if (!neighbour) return;

  // En una transacción para que un fallo a mitad no deje dos categorías
  // compartiendo posición. Mismo criterio que `moveLink`.
  await prisma.$transaction([
    prisma.menuCategory.update({
      where: { id: category.id },
      data: { position: neighbour.position },
    }),
    prisma.menuCategory.update({
      where: { id: neighbour.id },
      data: { position: category.position },
    }),
  ]);

  revalidateMenu(category.businessId);
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function createMenuItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return { error: "Falta la categoría." };

  const businessId = await categoryOwner(categoryId);
  if (!businessId) return { error: "La categoría no existe." };

  const parsed = menuItemSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const last = await prisma.menuItem.findFirst({
    where: { categoryId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.menuItem.create({
    data: { ...parsed.data, categoryId, position: (last?.position ?? -1) + 1 },
  });

  revalidateMenu(businessId);
  return { success: `"${parsed.data.name}" agregado al menú.` };
}

export async function updateMenuItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return { error: "Falta el producto." };

  const businessId = await itemOwner(itemId);
  if (!businessId) return { error: "El producto no existe." };

  const parsed = menuItemSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      priceCents: parsed.data.priceCents,
      imageUrl: parsed.data.imageUrl,
      available: parsed.data.available,
      featured: parsed.data.featured,
    },
  });

  revalidateMenu(businessId);
  return { success: "Producto actualizado." };
}

/** Marca un producto como agotado o disponible sin borrarlo. */
export async function toggleMenuItemAvailable(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: { available: true, category: { select: { businessId: true } } },
  });
  if (!item) return;

  await requireBusinessAccess(item.category.businessId);

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { available: !item.available },
  });

  revalidateMenu(item.category.businessId);
}

export async function deleteMenuItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const businessId = await itemOwner(itemId);
  if (!businessId) return;

  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidateMenu(businessId);
}

// ---------------------------------------------------------------------------

/**
 * Negocio dueño de una categoría, con el acceso ya validado.
 *
 * Devuelve `null` solo cuando la categoría no existe; si existe pero es de otro
 * negocio, `requireBusinessAccess` corta con 403 y esta función no retorna.
 */
async function categoryOwner(categoryId: string): Promise<string | null> {
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { businessId: true },
  });
  if (!category) return null;

  await requireBusinessAccess(category.businessId);
  return category.businessId;
}

async function itemOwner(itemId: string): Promise<string | null> {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: { category: { select: { businessId: true } } },
  });
  if (!item) return null;

  // Un producto sin categoría no puede existir: la relación es obligatoria y
  // el borrado es en cascada. Si aparece, algo se corrompió y no se sigue.
  if (!item.category) forbidden();

  await requireBusinessAccess(item.category.businessId);
  return item.category.businessId;
}

function revalidateMenu(businessId: string): void {
  revalidatePath("/client/menu");
  revalidatePath(`/app/businesses/${businessId}`);
}
