/**
 * Normaliza un `callbackUrl` recibido por querystring.
 *
 * Solo se aceptan rutas internas absolutas (`/algo`). Cualquier URL con
 * esquema, con host, o que empiece por `//` se descarta: son las formas de
 * convertir el login en un redirector abierto hacia un sitio de phishing.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  // `/\algo` es tratado como `//algo` por algunos navegadores.
  if (value.startsWith("/\\")) return fallback;

  return value;
}
