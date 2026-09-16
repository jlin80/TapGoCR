import { appName, tapgoOrigin } from "@/lib/config";

/**
 * Envoltorio HTML compartido por todos los templates.
 *
 * Tablas + estilos inline a propósito: es lo único que se renderiza
 * consistente entre Gmail, Outlook, Apple Mail y clientes móviles — flexbox y
 * `<style>` en el `<head>` no son confiables en varios de ellos. Nada de
 * imágenes pesadas: solo el nombre de marca en texto, para que el correo siga
 * siendo liviano y legible incluso con imágenes bloqueadas por defecto.
 */
const ADMIN_ORIGIN = tapgoOrigin.replace(/^https?:\/\//, "https://app.");

export type EmailLayoutInput = {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
};

export function renderEmailHtml(input: EmailLayoutInput): string {
  // Solo el contenido de la celda del botón: quien la use ya está dentro de
  // un <tr><td align="center">, no hace falta (ni es HTML válido) que este
  // fragmento traiga su propia fila.
  const ctaHtml = input.cta
    ? `
          <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="background-color:#00b86b;border-radius:8px;">
                <a href="${input.cta.url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#04201d;text-decoration:none;">
                  ${escapeHtml(input.cta.label)}
                </a>
              </td>
            </tr>
          </table>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(appName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f7f9;font-family:Arial,Helvetica,sans-serif;">
  ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#0f172a;padding:20px 32px;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;">TapGo<span style="color:#00b86b;">CR</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${escapeHtml(input.heading)}</h1>
              <div style="font-size:15px;line-height:1.6;color:#334155;">${input.bodyHtml}</div>
            </td>
          </tr>
          ${ctaHtml ? `<tr><td align="center" style="padding:0 32px 32px;">${ctaHtml}</td></tr>` : ""}
          <tr>
            <td style="padding:20px 32px;background-color:#f1f5f9;font-size:12px;color:#64748b;">
              ${escapeHtml(appName)} · NFC y QR para negocios en Costa Rica<br />
              <a href="${ADMIN_ORIGIN}" style="color:#64748b;">${ADMIN_ORIGIN.replace(/^https?:\/\//, "")}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { ADMIN_ORIGIN };
