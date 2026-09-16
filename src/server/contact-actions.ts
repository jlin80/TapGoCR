"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { emitContactLead } from "@/lib/notifications/dispatch";
import { prisma } from "@/lib/prisma";
import { limitPublicSubmission } from "@/lib/public-rate-limit";
import { extractClientIp, hashIp } from "@/lib/request-info";
import { contactSchema, firstIssue, formValues, leadUpdateSchema } from "@/lib/validation";

/**
 * Envíos permitidos por dirección IP y por hora.
 *
 * Se puede subir con CONTACT_RATE_LIMIT para que la suite de pruebas end-to-end
 * pueda repetirse; en producción conviene dejar el valor por defecto.
 */
const CONTACT_WINDOW_MS = 60 * 60 * 1000;

function contactLimit(): number {
  const configured = Number(process.env.CONTACT_RATE_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? configured : 3;
}

/**
 * Consulta enviada desde el sitio comercial.
 *
 * Es la única escritura de la aplicación que no exige sesión, así que es la
 * superficie más expuesta: lleva validación estricta, campo trampa contra
 * robots y límite por IP.
 */
export async function submitContact(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // Campo trampa completado: casi con certeza un robot. Se responde como si
  // hubiera funcionado para no darle pistas, pero no se guarda nada.
  if (parsed.data.website) {
    return { success: "¡Gracias! Te vamos a responder pronto." };
  }

  const requestHeaders = await headers();
  const ip = extractClientIp(requestHeaders);
  const ipHash = hashIp(ip);

  const limit = limitPublicSubmission({
    kind: "contact",
    headers: requestHeaders,
    limit: contactLimit(),
    windowMs: CONTACT_WINDOW_MS,
  });

  if (!limit.allowed) {
    return {
      error:
        "Ya recibimos varias consultas tuyas. Esperá un momento antes de enviar otra.",
    };
  }

  let lead: { id: string };
  try {
    lead = await prisma.contactLead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        businessName: parsed.data.businessName,
        message: parsed.data.message,
        ipHash,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[tapgocr] no se pudo guardar la consulta", error);
    return {
      error: "No pudimos enviar tu consulta. Probá de nuevo en un momento.",
    };
  }

  void emitContactLead({
    eventId: `contact-lead-created:${lead.id}`,
    leadId: lead.id,
    name: parsed.data.name,
    email: parsed.data.email,
    businessName: parsed.data.businessName,
    messagePreview: parsed.data.message.slice(0, 280),
  });

  revalidatePath("/app/leads");
  return {
    success: "¡Gracias! Recibimos tu consulta y te vamos a responder pronto.",
  };
}

// ---------------------------------------------------------------------------
// Administración de consultas
// ---------------------------------------------------------------------------

export async function updateLead(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const parsed = leadUpdateSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  await prisma.contactLead.update({
    where: { id: parsed.data.leadId },
    data: { status: parsed.data.status, notes: parsed.data.notes },
  });

  revalidatePath("/app/leads");
  return { success: "Consulta actualizada." };
}

export async function deleteLead(formData: FormData): Promise<void> {
  await requireRoot();

  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;

  await prisma.contactLead.delete({ where: { id: leadId } });
  revalidatePath("/app/leads");
}
