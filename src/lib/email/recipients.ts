/**
 * Buzones internos de TapGoCR. No son secretos (son la dirección pública de
 * contacto de cada área) y son fijos al dominio real de producción a
 * propósito: `NEXT_PUBLIC_TAPGO_DOMAIN` puede apuntar a `localhost:3000` en
 * desarrollo, y "info@localhost:3000" no es una dirección válida.
 */
export const INTERNAL_EMAIL = {
  info: "info@tapgocr.com",
  support: "support@tapgocr.com",
  sales: "sales@tapgocr.com",
} as const;

export type InternalDepartment = keyof typeof INTERNAL_EMAIL;
