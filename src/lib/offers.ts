/**
 * Propuesta comercial pública: placa (pago único) + TapGo Smart / Business
 * (suscripción opcional).
 *
 * A propósito NO vive en `plans.ts`: ese archivo es la fuente de verdad
 * interna que usa ROOT para cuotas de placas y MRR (`Business.plan` en la
 * base de datos, en USD, por cantidad de placas incluidas). Esta propuesta es
 * la cotización pública que se muestra en el sitio — hoy nadie paga
 * automáticamente por ninguna de las dos tablas, así que separarlas evita que
 * un cambio de copy en el sitio corrompa el cálculo de MRR de ROOT, y
 * viceversa. Conciliar ambos modelos en uno solo es un cambio de negocio
 * aparte, no de marketing — ver recomendación en la auditoría.
 */

export type HardwareTier = {
  placas: number;
  price: string;
  /** Precio por placa, ya calculado, para reforzar "más placas, menos por unidad". */
  perUnit: string;
};

export const HARDWARE_TIERS: HardwareTier[] = [
  { placas: 1, price: "₡14.900", perUnit: "₡14.900 c/u" },
  { placas: 3, price: "₡34.900", perUnit: "₡11.633 c/u" },
  { placas: 5, price: "₡49.900", perUnit: "₡9.980 c/u" },
  { placas: 10, price: "₡69.900", perUnit: "₡6.990 c/u" },
];

export const TAPGO_FEATURES = [
  "Placa personalizada con tu diseño",
  "NFC + QR en la misma placa",
  "Página pública con tus enlaces",
  "Configuración y programación incluidas",
  "Entrega lista para usar",
];

export const SMART_PRICE = "₡5.990";
export const BUSINESS_PRICE = "₡9.990";

export const SMART_FEATURES = [
  "NFC y QR dinámicos: cambiá el destino sin tocar la placa",
  "Analytics de escaneos y taps por placa",
  "Qué botón toca más tu clientela",
  "Gestión de contenido desde tu panel",
  "Hosting, mantenimiento y actualizaciones",
  "Soporte incluido",
];

export const BUSINESS_FEATURES = [
  "Todo lo de TapGo Smart",
  "Varios usuarios de tu equipo con acceso al panel",
  "Pensado para negocios con más de un punto de contacto",
];

/** Solo lo que ya existe en el código hoy — nada de CRM, reservas ni campañas. */
export const BUSINESS_COMING_SOON = [
  "Comparativa de estadísticas entre sucursales",
  "Herramientas de campañas y promociones",
];

export const ADDON_PLACA_PRICE = "₡6.900";
export const ADDON_NFC_PRICE = "₡1.900";

export const TRIAL_DAYS = 30;
