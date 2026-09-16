"use server";

import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { mailerConfigured } from "@/lib/mailer";
import { sendEmailNotification } from "@/lib/email/service";

/** Estado para el panel de admin. Nunca incluye credenciales SMTP. */
export async function emailStatus(): Promise<{ configured: boolean }> {
  await requireRoot();
  return { configured: mailerConfigured() };
}

/**
 * Envía un correo de prueba a la propia cuenta ROOT que lo pide. Corre
 * exclusivamente en el servidor — nunca recibe ni expone credenciales SMTP.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- firma exigida por useActionState/ActionForm; esta prueba no necesita ningún campo del formulario.
export async function sendEmailTest(_previous: ActionState, _formData: FormData): Promise<ActionState> {
  const actor = await requireRoot();

  if (!mailerConfigured()) {
    return { error: "SMTP no está configurado todavía." };
  }
  if (!actor.email) {
    return { error: "Tu cuenta no tiene un correo configurado para recibir la prueba." };
  }

  const result = await sendEmailNotification({
    notificationId: `manual-test:${Date.now()}`,
    template: "manual-test",
    to: actor.email,
    subject: "Prueba de TapGoCR",
    html: "<p>Este es un correo de prueba enviado desde el panel de administración.</p>",
    text: "Este es un correo de prueba enviado desde el panel de administración.",
  });

  if (!result.sent) {
    return { error: `No se pudo enviar la prueba (${result.reason}).` };
  }

  return { success: `Prueba enviada a ${actor.email}. Revisá tu bandeja.` };
}
