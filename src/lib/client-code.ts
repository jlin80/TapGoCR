import { prisma } from "@/lib/prisma";

/**
 * Código visible de cliente, tipo `TGC-0001`.
 *
 * Lo asigna el sistema al aprobar una solicitud: nadie elige su usuario. Sirve
 * para identificar a un cliente sin exponer el id interno de la base, y para
 * iniciar sesión como alternativa al correo.
 */
const PREFIX = "TGC";
const PADDING = 4;

export function formatClientCode(sequence: number): string {
  return `${PREFIX}-${String(sequence).padStart(PADDING, "0")}`;
}

/** Interpreta un código y devuelve su número, o null si no tiene el formato. */
export function parseClientCode(code: string): number | null {
  const match = code.trim().toUpperCase().match(/^TGC-(\d+)$/);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Siguiente código libre.
 *
 * Se calcula a partir del mayor existente en lugar de contar filas: si alguna
 * cuenta se borra, contar volvería a entregar un código ya usado.
 *
 * Quien lo llama debe manejar la colisión —el índice único de la base es la
 * garantía real— porque entre el cálculo y la inserción podría entrar otra alta.
 * En la práctica las aprobaciones son manuales y no concurren.
 */
export async function nextClientCode(): Promise<string> {
  // Se trae la columna y se calcula el máximo en memoria en lugar de ordenar en
  // SQL: el orden alfabético pondría TGC-10000 antes que TGC-9999 y el contador
  // retrocedería al superar los cuatro dígitos.
  const codes = await prisma.user.findMany({
    where: { clientCode: { not: null } },
    select: { clientCode: true },
  });

  const lastSequence = codes.reduce((max, row) => {
    const sequence = row.clientCode ? parseClientCode(row.clientCode) : null;
    return sequence && sequence > max ? sequence : max;
  }, 0);

  return formatClientCode(lastSequence + 1);
}

/** Normaliza lo que alguien escribe en el login: `tgc1` y `TGC-0001` coinciden. */
export function normalizeClientCode(value: string): string | null {
  const compact = value.trim().toUpperCase().replace(/[\s-]/g, "");
  const match = compact.match(/^TGC(\d{1,6})$/);
  if (!match) return null;

  return formatClientCode(Number(match[1]));
}

export type Identifier =
  | { kind: "code"; value: string }
  | { kind: "email"; value: string };

/**
 * Interpreta lo que alguien escribe en el login.
 *
 * Se acepta el correo o el código de cliente porque el identificador lo asigna
 * el sistema: quien solo recuerda su código igual puede entrar.
 */
export function resolveIdentifier(raw: string): Identifier {
  const code = normalizeClientCode(raw);
  if (code) return { kind: "code", value: code };

  return { kind: "email", value: raw.trim().toLowerCase() };
}
