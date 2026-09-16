import { forbidden, redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Capa de autorización del lado del servidor.
 *
 * Regla del proyecto: ninguna página, acción o route handler consulta la base de
 * datos con un identificador que venga de la URL sin pasar antes por alguna de
 * estas funciones. Ocultar botones en el frontend no es una medida de seguridad.
 */

export type SessionUser = {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

/** Exige sesión iniciada. Sin ella redirige al login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige rol ROOT. Un CLIENT autenticado recibe 403, no una redirección. */
export async function requireRoot(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== UserRole.ROOT) forbidden();
  return user;
}

/** Exige rol CLIENT. Una cuenta ROOT se envía a su propio panel. */
export async function requireClient(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === UserRole.ROOT) redirect("/app/dashboard");
  return user;
}

/**
 * Identificadores de los negocios a los que un usuario puede acceder.
 * Para una cuenta ROOT devuelve null, que significa "sin restricción".
 */
export async function accessibleBusinessIds(
  user: SessionUser,
): Promise<string[] | null> {
  if (user.role === UserRole.ROOT) return null;

  const memberships = await prisma.businessUser.findMany({
    where: { userId: user.id },
    select: { businessId: true },
  });

  return memberships.map((m) => m.businessId);
}

/**
 * Negocio principal de un cliente. El MVP asigna un negocio por cliente, pero
 * el modelo ya admite varios, así que se toma el más antiguo de forma estable.
 */
export async function primaryBusinessId(user: SessionUser): Promise<string | null> {
  const membership = await prisma.businessUser.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { businessId: true },
  });

  return membership?.businessId ?? null;
}

/**
 * Verifica que la sesión actual puede operar sobre `businessId`.
 *
 * Una cuenta ROOT accede a cualquier negocio existente. Un CLIENT solo a aquellos
 * donde tiene una fila en BusinessUser. En ambos casos, un negocio inexistente
 * y uno ajeno producen la misma respuesta 403, para no filtrar qué IDs existen.
 */
export async function requireBusinessAccess(
  businessId: string,
): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role === UserRole.ROOT) {
    const exists = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!exists) forbidden();
    return user;
  }

  const membership = await prisma.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: user.id } },
    select: { id: true },
  });

  if (!membership) forbidden();
  return user;
}

/**
 * Resuelve el negocio dueño de un tag y valida el acceso en un solo paso.
 * Evita el patrón `findUnique(tagId)` seguido de una comprobación olvidadiza.
 */
export async function requireTagAccess(
  tagId: string,
): Promise<{ user: SessionUser; businessId: string }> {
  const user = await requireUser();

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { businessId: true },
  });

  if (!tag) forbidden();

  if (user.role !== UserRole.ROOT) {
    const membership = await prisma.businessUser.findUnique({
      where: { businessId_userId: { businessId: tag.businessId, userId: user.id } },
      select: { id: true },
    });
    if (!membership) forbidden();
  }

  return { user, businessId: tag.businessId };
}
