import { appName } from "@/lib/config";
import { renderEmailHtml } from "@/lib/email/layout";

/** SUPPORT_REQUEST_CREATED → cliente. */
export function supportReceivedEmail(params: { businessName: string; title: string }) {
  return {
    subject: `Recibimos tu solicitud — ${appName}`,
    html: renderEmailHtml({
      heading: "Recibimos tu solicitud",
      bodyHtml: `
        <p>Hola,</p>
        <p>Recibimos tu solicitud para <strong>${params.businessName}</strong>: "${escapeForHtml(params.title)}".</p>
        <p>El equipo de ${appName} la va a revisar y te vamos a contactar.</p>
      `,
    }),
    text: `Recibimos tu solicitud para ${params.businessName}: "${params.title}". El equipo de ${appName} la va a revisar y te va a contactar.`,
  };
}

function escapeForHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
