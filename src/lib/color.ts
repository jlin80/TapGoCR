/**
 * Utilidades de color para la personalización de la landing.
 *
 * Todas asumen la forma `#rrggbb`, que es la única que acepta la validación de
 * `publicProfileSchema`. Ante un valor con otra forma devuelven algo seguro en
 * lugar de lanzar: un color mal escrito no puede tumbar la página que se abre
 * al tocar una placa.
 */

const HEX = /^#([0-9a-f]{6})$/i;

function toRgb(hex: string): [number, number, number] | null {
  const match = HEX.exec(hex.trim());
  if (!match) return null;

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Luminancia relativa según WCAG. Es lo que decide si un color se percibe como
 * claro u oscuro, y no el promedio de los canales: el ojo humano es mucho más
 * sensible al verde que al azul.
 */
export function relativeLuminance(hex: string): number | null {
  const rgb = toRgb(hex);
  if (!rgb) return null;

  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Color de texto legible sobre un fondo dado.
 *
 * El umbral 0.5 de luminancia es el punto donde el negro y el blanco empatan en
 * contraste. Un negocio con marca amarilla recibe texto negro; uno con marca
 * azul oscuro, blanco. Ante un valor inválido devuelve blanco, que es el
 * comportamiento anterior a la personalización.
 */
export function contrastColor(hex: string): string {
  const luminance = relativeLuminance(hex);
  if (luminance === null) return "#ffffff";

  return luminance > 0.5 ? "#0f172a" : "#ffffff";
}

/**
 * Aclara (`amount` positivo) u oscurece (negativo) un color, con `amount` entre
 * -1 y 1. Se usa para derivar el tono de `hover` cuando el negocio configuró un
 * solo color de marca.
 */
export function shade(hex: string, amount: number): string {
  const rgb = toRgb(hex);
  if (!rgb) return hex;

  const target = amount < 0 ? 0 : 255;
  const ratio = Math.min(Math.abs(amount), 1);

  const [r, g, b] = rgb.map((channel) => channel + (target - channel) * ratio);
  return toHex(r, g, b);
}
