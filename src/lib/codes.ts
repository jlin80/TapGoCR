import { randomBytes } from "node:crypto";

/**
 * Alfabeto Crockford-like: sin I, L, O, U, 0 ni 1 para evitar confusiones al
 * dictar o transcribir un código impreso.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

const DEFAULT_LENGTH = 10;

/**
 * Genera el código público de un tag.
 *
 * Debe ser impredecible: es la única credencial que separa la landing de un
 * negocio de la de otro. Nunca derivarlo de un identificador secuencial.
 */
export function generateTagCode(length: number = DEFAULT_LENGTH): string {
  if (length < 6) {
    throw new Error("El código de un tag debe tener al menos 6 caracteres.");
  }

  // 30 símbolos no divide a 256, así que se descartan los bytes que caerían en
  // el rango sesgado en lugar de aplicar un módulo directo.
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let code = "";

  while (code.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= limit) continue;
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (code.length === length) break;
    }
  }

  return code;
}

export { CODE_ALPHABET };
