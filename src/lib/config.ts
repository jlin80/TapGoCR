/**
 * Configuración central de TapGoCR.
 *
 * El dominio público NO se escribe en ningún otro archivo. Cualquier URL de tag
 * se construye con `tagUrl()`; migrar a otro dominio consiste únicamente en
 * cambiar NEXT_PUBLIC_TAPGO_DOMAIN.
 *
 * Las variables NEXT_PUBLIC_* se referencian de forma literal porque Next.js las
 * sustituye en tiempo de compilación; no usar acceso dinámico a process.env.
 */

const DEFAULT_DOMAIN = "localhost:3000";
const DEFAULT_APP_NAME = "TapGoCR";

/** Nombre de marca mostrado en la interfaz, títulos y correos. */
export const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_APP_NAME;

/** Dominio público, sin protocolo ni barra final. Ej.: `tapgocr.com`. */
export const tapgoDomain = normalizeDomain(
  process.env.NEXT_PUBLIC_TAPGO_DOMAIN?.trim() || DEFAULT_DOMAIN,
);

/**
 * Protocolo del dominio público. Por defecto https; se degrada a http solo
 * cuando la variable lo indica explícitamente (útil en desarrollo local).
 */
export const tapgoProtocol =
  process.env.NEXT_PUBLIC_TAPGO_PROTOCOL?.trim() === "http" ? "http" : "https";

/** Origen público completo. Ej.: `https://tapgocr.com`. */
export const tapgoOrigin = `${tapgoProtocol}://${tapgoDomain}`;

/** Mostrar "Powered by TapGoCR" en el pie de la landing pública. */
export const showBranding = process.env.NEXT_PUBLIC_TAPGO_SHOW_BRANDING !== "false";

/** URL pública de un tag. Es la que se programa en el NFC, sin parámetros. */
export function tagUrl(code: string): string {
  return `${tapgoOrigin}/t/${code}`;
}

/**
 * Misma URL, marcada como proveniente del QR impreso.
 *
 * Permite separar en analytics un tap del NFC de un escaneo del QR, y que el
 * QR no consuma la cuota de taps del chip. Es una aproximación: quien abra la
 * URL limpia a mano o la comparta cuenta como tap.
 */
export function tagQrUrl(code: string): string {
  return `${tagUrl(code)}?s=qr`;
}

// ---------------------------------------------------------------------------
// Contacto comercial (página pública)
//
// Se muestran solo si están configurados: es preferible una página sin botón de
// contacto a una con un número que no existe.
// ---------------------------------------------------------------------------

export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

/** Número en formato internacional sin signos, por ejemplo 50688887777. */
const rawWhatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || "";

export const contactWhatsapp = rawWhatsapp || null;

export const contactWhatsappUrl = contactWhatsapp
  ? `https://wa.me/${contactWhatsapp}`
  : null;

/** Formato legible: +506 8888 7777 */
export function formatWhatsapp(value: string): string {
  const match = value.match(/^(\d{3})(\d{4})(\d{4})$/);
  return match ? `+${match[1]} ${match[2]} ${match[3]}` : `+${value}`;
}

/**
 * Código de un tag de ejemplo para enseñar una landing real desde la página
 * comercial. Sin configurar, la sección no se muestra.
 */
export const demoTagCode = process.env.NEXT_PUBLIC_DEMO_TAG_CODE?.trim() || null;

function normalizeDomain(value: string): string {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .trim();
}
