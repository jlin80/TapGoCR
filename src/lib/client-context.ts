import type { Industry, Plan } from "@/generated/prisma/enums";
import { primaryBusinessId, requireClient, type SessionUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export type ClientContext = {
  user: SessionUser;
  business: {
    id: string;
    name: string;
    description: string | null;
    industry: Industry | null;
    address: string | null;
    phone: string | null;
    whatsapp: string | null;
    websiteUrl: string | null;
    active: boolean;
    plan: Plan;
    planStartedAt: Date;
    includedTagsOverride: number | null;
  } | null;
};

/**
 * Resuelve la sesión del cliente y el negocio que le corresponde.
 *
 * El panel del cliente nunca acepta un identificador de negocio por la URL: el
 * negocio se deriva siempre de la sesión. Así no hay ningún parámetro que
 * manipular para llegar a datos ajenos.
 */
export async function getClientContext(): Promise<ClientContext> {
  const user = await requireClient();
  const businessId = await primaryBusinessId(user);

  if (!businessId) return { user, business: null };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      description: true,
      industry: true,
      address: true,
      phone: true,
      whatsapp: true,
      websiteUrl: true,
      active: true,
      plan: true,
      planStartedAt: true,
      includedTagsOverride: true,
    },
  });

  return { user, business };
}
