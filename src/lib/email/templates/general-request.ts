import { appName } from "@/lib/config";
import { renderEmailHtml } from "@/lib/email/layout";

/** CONTACT_LEAD_CREATED (consulta general o comercial del sitio) → cliente. */
export function generalRequestReceivedEmail(params: { name: string }) {
  return {
    subject: `Recibimos tu consulta — ${appName}`,
    html: renderEmailHtml({
      heading: `¡Gracias, ${params.name}!`,
      bodyHtml: `<p>Recibimos tu consulta y te vamos a responder pronto.</p>`,
    }),
    text: `¡Gracias, ${params.name}! Recibimos tu consulta y te vamos a responder pronto.`,
  };
}

/** Aviso interno genérico (info@/support@/sales@) para una consulta o solicitud entrante. */
export function internalLeadEmail(params: {
  department: "info" | "support" | "sales";
  name: string;
  email: string;
  businessName?: string | null;
  message: string;
  adminUrl: string;
}) {
  const labels = { info: "consulta general", support: "solicitud de soporte", sales: "solicitud comercial" };
  return {
    subject: `Nueva ${labels[params.department]} — ${appName}`,
    html: renderEmailHtml({
      heading: `Nueva ${labels[params.department]}`,
      bodyHtml: `
        <p><strong>Nombre:</strong> ${escapeForHtml(params.name)}<br />
        <strong>Email:</strong> ${escapeForHtml(params.email)}<br />
        ${params.businessName ? `<strong>Negocio:</strong> ${escapeForHtml(params.businessName)}<br />` : ""}
        </p>
        <p>${escapeForHtml(params.message)}</p>
      `,
      cta: { label: "Ver en el panel", url: params.adminUrl },
    }),
    text: `Nueva ${labels[params.department]} de ${params.name} (${params.email}). ${params.message}`,
  };
}

function escapeForHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
