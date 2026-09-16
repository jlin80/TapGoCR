import { appName } from "@/lib/config";
import { renderEmailHtml } from "@/lib/email/layout";

/** SUPPORT_REQUEST_UPDATED → cliente. */
export function supportUpdatedEmail(params: { businessName: string; title: string; status: string }) {
  return {
    subject: `Tu solicitud se actualizó — ${appName}`,
    html: renderEmailHtml({
      heading: "Tu solicitud se actualizó",
      bodyHtml: `<p>La solicitud "${escapeForHtml(params.title)}" de <strong>${escapeForHtml(params.businessName)}</strong> ahora está: <strong>${params.status}</strong>.</p>`,
    }),
    text: `La solicitud "${params.title}" de ${params.businessName} ahora está: ${params.status}.`,
  };
}

function escapeForHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
