"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { BusinessRole, UserRole } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { requireRoot, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { clientNameTaken, NameConflictError, withNameLock } from "@/lib/uniqueness";
import {
  firstIssue,
  formValues,
  passwordSchema,
  resetPasswordSchema,
  userSchema,
} from "@/lib/validation";

const BCRYPT_ROUNDS = 12;

/**
 * Alta de usuarios cliente y asignación a negocios.
 *
 * El equipo de TapGoCR crea la cuenta y entrega la contraseña inicial: no hay
 * registro público. Nunca se crean usuarios ROOT desde la interfaz.
 */
export async function createClientUser(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = userSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { email, name, password, businessId } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return { error: "Ya existe una cuenta con ese correo." };

  if (businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) return { error: "El negocio seleccionado no existe." };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await withNameLock(name, async (tx) => {
      if (await clientNameTaken(name, undefined, undefined, tx)) {
        throw new NameConflictError("Ya existe una cuenta con ese nombre.");
      }

      await tx.user.create({
        data: {
          email,
          name,
          role: UserRole.CLIENT,
          passwordHash,
          ...(businessId
            ? {
                memberships: {
                  create: { businessId, role: BusinessRole.OWNER },
                },
              }
            : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof NameConflictError) return { error: error.message };
    throw error;
  }

  revalidatePath("/app/users");
  if (businessId) revalidatePath(`/app/businesses/${businessId}`);
  return { success: `Cuenta creada para ${email}.` };
}

export async function assignUserToBusiness(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const userId = String(formData.get("userId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const role = String(formData.get("role") ?? BusinessRole.OWNER);

  if (!userId || !businessId) return { error: "Faltan datos." };
  if (!Object.values(BusinessRole).includes(role as BusinessRole)) {
    return { error: "Rol inválido." };
  }

  const [user, business] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { id: true } }),
  ]);

  if (!user || !business) return { error: "El usuario o el negocio no existe." };
  if (user.role === UserRole.ROOT) {
    return { error: "Una cuenta ROOT ya tiene acceso a todos los negocios." };
  }

  await prisma.businessUser.upsert({
    where: { businessId_userId: { businessId, userId } },
    update: { role: role as BusinessRole },
    create: { businessId, userId, role: role as BusinessRole },
  });

  revalidatePath("/app/users");
  revalidatePath(`/app/businesses/${businessId}`);
  return { success: "Usuario asignado al negocio." };
}

export async function removeUserFromBusiness(formData: FormData): Promise<void> {
  await requireRoot();

  const userId = String(formData.get("userId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  if (!userId || !businessId) return;

  await prisma.businessUser.deleteMany({ where: { userId, businessId } });

  revalidatePath("/app/users");
  revalidatePath(`/app/businesses/${businessId}`);
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const root = await requireRoot();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  // Sin esto, una cuenta ROOT podría dejarse fuera de su propia plataforma.
  if (userId === root.id) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { active: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  revalidatePath("/app/users");
}

/**
 * Restablece la contraseña de una cuenta de cliente que perdió la suya.
 *
 * Se limita a cuentas CLIENT a propósito: un administrador no puede tomar la
 * cuenta de otro administrador, y para la propia existe el cambio con
 * contraseña actual.
 */
export async function resetClientPassword(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = resetPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, email: true },
  });

  if (!user) return { error: "La cuenta no existe." };
  if (user.role !== UserRole.CLIENT) {
    return {
      error:
        "Solo se pueden restablecer contraseñas de clientes. Un administrador cambia la suya desde Configuración.",
    };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS) },
  });

  revalidatePath("/app/users");
  return {
    success: `Contraseña restablecida para ${user.email}. Entregala por un canal seguro.`,
  };
}

/** Cambio de contraseña propio, disponible para cualquier sesión iniciada. */
export async function changeOwnPassword(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  const parsed = passwordSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "No se encontró la cuenta." };

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) return { error: "La contraseña actual no es correcta." };

  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS) },
  });

  return { success: "Contraseña actualizada." };
}
