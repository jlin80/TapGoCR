import { appName, appOrigin, tapgoOrigin } from "@/lib/config";
import { renderEmailHtml } from "@/lib/email/layout";

const ADMIN_ORIGIN = appOrigin;

/** USER_CREATED → cliente. */
export function welcomeEmail(params: { name: string; clientCode: string }) {
  const subject = `Bienvenido a ${appName}`;
  const heading = `¡Bienvenido, ${params.name}!`;
  const bodyHtml = `
    <p>Tu cuenta de ${appName} ya está lista. Tu código de cliente es <strong>${params.clientCode}</strong> — podés usarlo para entrar en lugar del correo si preferís.</p>
    <p>Desde tu panel podés editar tu menú, tus enlaces y ver las estadísticas de tus placas.</p>
  `;

  return {
    subject,
    html: renderEmailHtml({
      heading,
      bodyHtml,
      cta: { label: "Ver paquetes", url: `${tapgoOrigin}/precios` },
    }),
    text: `¡Bienvenido, ${params.name}!\n\nTu cuenta de ${appName} ya está lista. Tu código de cliente es ${params.clientCode}.\n\nMirá los paquetes disponibles en ${tapgoOrigin}/precios, o ingresá directo en ${ADMIN_ORIGIN}/login`,
  };
}
