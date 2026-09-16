import type { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Bitácora de operaciones sensibles.
 *
 * Se llama SIEMPRE después de que la operación haya tenido éxito, nunca antes:
 * una entrada de auditoría que describe algo que no pasó es peor que no tener
 * bitácora.
 *
 * Igual que el tracking, no propaga errores. Que falle el registro no puede
 * deshacer una operación que ya se completó; queda constancia en el log del
 * servidor para investigarlo.
 */
export const AUDIT_ACTIONS = {
  BUSINESS_PLAN_CHANGED: "BUSINESS_PLAN_CHANGED",
  BUSINESS_DEACTIVATED: "BUSINESS_DEACTIVATED",
  BUSINESS_REACTIVATED: "BUSINESS_REACTIVATED",
  TAG_REASSIGNED: "TAG_REASSIGNED",
} as const;

export async function recordAudit(input: {
  actor: SessionUser;
  action: string;
  entityType: string;
  entityId: string;
  businessId?: string | null;
  details?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        businessId: input.businessId ?? null,
        details: input.details,
      },
    });
  } catch (error) {
    console.error("[tapgocr] no se pudo registrar la entrada de auditoría", error);
  }
}

/** Entradas de auditoría de una entidad, de la más reciente a la más antigua. */
export function auditTrailFor(entityType: string, entityId: string, take = 20) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      actorEmail: true,
      details: true,
      createdAt: true,
    },
  });
}
