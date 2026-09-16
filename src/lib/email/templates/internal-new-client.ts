import { appName } from "@/lib/config";
import { renderEmailHtml } from "@/lib/email/layout";

/** USER_CREATED + BUSINESS_CREATED → info@tapgocr.com. */
export function internalNewClientEmail(params: {
  userName: string;
  userEmail: string;
  businessName: string;
  clientCode: string;
  source: "AUTO" | "ROOT";
  adminUrl: string;
}) {
  return {
    subject: `Nuevo cliente — ${appName}`,
    html: renderEmailHtml({
      heading: "Nuevo cliente",
      bodyHtml: `
        <p><strong>Nombre:</strong> ${escapeForHtml(params.userName)}<br />
        <strong>Email:</strong> ${escapeForHtml(params.userEmail)}<br />
        <strong>Negocio:</strong> ${escapeForHtml(params.businessName)}<br />
        <strong>Código:</strong> ${params.clientCode}<br />
        <strong>Origen:</strong> ${params.source === "AUTO" ? "Alta automática" : "Aprobado por ROOT"}</p>
      `,
      cta: { label: "Ver cliente", url: params.adminUrl },
    }),
    text: `Nuevo cliente: ${params.userName} (${params.userEmail}), negocio ${params.businessName}, código ${params.clientCode}.`,
  };
}

function escapeForHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
