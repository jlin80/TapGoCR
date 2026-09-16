/**
 * Precios del menú digital.
 *
 * Se guardan como céntimos enteros: 2 500,50 colones son 250050. Trabajar con
 * enteros evita que una carta con veinte productos acumule errores de coma
 * flotante al sumarse, y deja la puerta abierta a totales y pedidos sin migrar
 * la columna.
 *
 * Módulo puro a propósito, sin acceso a base de datos: lo usan tanto la
 * validación de formularios como el renderizado.
 */

const CURRENCY = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

/**
 * Formatea para mostrar. Sin decimales porque los precios de carta en Costa
 * Rica se escriben redondeados; los céntimos existen para la aritmética, no
 * para la vista.
 */
export function formatPrice(priceCents: number | null): string | null {
  if (priceCents === null) return null;
  return CURRENCY.format(priceCents / 100);
}

/**
 * Convierte lo que escribe el negocio a céntimos.
 *
 * Acepta "2500", "2 500", "2500,50" y "2500.50". Devuelve `null` para la
 * cadena vacía —un producto sin precio es válido, hay cartas que dicen "precio
 * del día"— y `NaN` para lo que no es un número, que la validación rechaza.
 */
export function parsePriceToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;

  return Math.round(amount * 100);
}
