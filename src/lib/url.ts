/**
 * Validación de URLs para los enlaces que un negocio publica en su landing.
 *
 * Se usa una lista de permitidos en lugar de una lista de bloqueados: cualquier
 * esquema que no esté aquí queda rechazado, lo que cubre `javascript:`, `data:`,
 * `vbscript:`, `file:` y cualquier variante futura sin tener que enumerarlas.
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

const SPACE = 0x20;
const DEL = 0x7f;

/**
 * El parser de `URL` descarta silenciosamente espacios y caracteres de control
 * intercalados, que es el truco clásico para colar `java<TAB>script:`. Se
 * rechazan antes de parsear en lugar de confiar en la normalización.
 */
function hasControlOrSpace(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= SPACE || code === DEL) return true;
  }
  return false;
}

export type UrlCheck = { ok: true; url: string } | { ok: false; reason: string };

export function checkUrl(value: string): UrlCheck {
  const raw = value.trim();

  if (!raw) {
    return { ok: false, reason: "La URL no puede estar vacía." };
  }

  if (hasControlOrSpace(raw)) {
    return { ok: false, reason: "La URL contiene espacios o caracteres de control." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      ok: false,
      reason: "Formato de URL inválido. Incluí el protocolo, por ejemplo https://",
    };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      reason: `El esquema "${parsed.protocol}" no está permitido. Usá https://, http://, mailto: o tel:`,
    };
  }

  return { ok: true, url: parsed.toString() };
}

export function isSafeUrl(value: string): boolean {
  return checkUrl(value).ok;
}

export { ALLOWED_PROTOCOLS };
