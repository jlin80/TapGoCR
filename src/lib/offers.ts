/**
 * Fuente única de verdad del modelo comercial: nombres, precios, cuotas de
 * placas y features de cada plan. `plans.ts` (el que usa ROOT para cuotas,
 * badges y MRR) deriva sus tablas internas de este archivo en vez de
 * mantener una segunda copia — antes existían dos modelos en paralelo
 * (Starter/Business/Pro acá, Local/Business/Chain en dólares en `plans.ts`)
 * que ya no coinciden entre sí; ahora `Plan.LOCAL` se muestra como
 * "Starter", `BUSINESS` como "Business" y `CHAIN` como "Pro" — mismo enum de
 * base de datos, sin migración, un solo lugar con los números reales.
 */

export type PublicPlan = {
  slug: "starter" | "business" | "pro";
  name: string;
  /** Pago único: placa, chip NFC, QR y configuración inicial. */
  initialPrice: string;
  /** Mensualidad: plataforma, hosting, analytics, dashboard, soporte. */
  monthlyPrice: string;
  /** Mismo valor que `monthlyPrice`, en colones, para cálculos (MRR/ARPU) — nunca se formatea a mano en dos lugares. */
  monthlyPriceCrc: number;
  points: number;
  additionalPointPrice: string;
  idealFor: string;
  features: string[];
  featured?: boolean;
  cta: string;
};

export const PLANS: PublicPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    initialPrice: "₡9.900",
    monthlyPrice: "₡1.990",
    monthlyPriceCrc: 1990,
    points: 1,
    additionalPointPrice: "₡3.990",
    idealFor: "Emprendimientos, negocios chicos y profesionales independientes",
    features: [
      "1 punto TapGo (1 placa)",
      "NFC + QR",
      "Página digital",
      "Configuración inicial",
      "WhatsApp, redes y Google Maps",
      "Menú o enlaces",
      "Analytics básico",
      "Panel de administración",
    ],
    cta: "Empezar con Starter",
  },
  {
    slug: "business",
    name: "Business",
    initialPrice: "₡19.900",
    monthlyPrice: "₡4.990",
    monthlyPriceCrc: 4990,
    points: 3,
    additionalPointPrice: "₡3.490",
    idealFor: "Restaurantes, cafeterías, bares, barberías, gimnasios y tiendas",
    features: [
      "3 puntos TapGo (3 placas)",
      "NFC + QR",
      "Página digital personalizada",
      "WhatsApp, redes y Google Maps",
      "Menú o enlaces",
      "Analytics completo",
      "Estadísticas por placa",
      "Panel de administración",
      "Soporte",
    ],
    featured: true,
    cta: "Elegir Business",
  },
  {
    slug: "pro",
    name: "Pro",
    initialPrice: "₡39.900",
    monthlyPrice: "₡8.990",
    monthlyPriceCrc: 8990,
    points: 8,
    additionalPointPrice: "₡2.990",
    idealFor: "Restaurantes grandes, negocios con varios espacios y hoteles pequeños",
    features: [
      "8 puntos TapGo (8 placas)",
      "NFC + QR",
      "Página digital personalizada",
      "WhatsApp, redes y Google Maps",
      "Menú o enlaces",
      "Analytics completo",
      "Estadísticas individuales por placa",
      "Panel de administración",
      "Configuración personalizada",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
  },
];

/** Opción secundaria, para quien rechaza una mensualidad. Menos funciones a propósito. */
export const ONE_TIME_OPTION = {
  price: "₡14.900",
  features: ["1 placa", "NFC", "QR", "Página básica", "WhatsApp, redes y Google Maps"],
  cta: "Ver opción de pago único",
};

/** Filas de la tabla comparativa. `value` por slug de plan; `true`/`false` se pinta como check/guion. */
export const COMPARISON_ROWS: Array<{
  label: string;
  values: Record<PublicPlan["slug"], string | boolean>;
}> = [
  { label: "Puntos TapGo (placas)", values: { starter: "1", business: "3", pro: "8" } },
  { label: "NFC + QR", values: { starter: true, business: true, pro: true } },
  { label: "Página digital", values: { starter: true, business: true, pro: true } },
  { label: "WhatsApp y redes", values: { starter: true, business: true, pro: true } },
  { label: "Google Maps", values: { starter: true, business: true, pro: true } },
  {
    label: "Analytics",
    values: { starter: "Básico", business: "Completo", pro: "Completo" },
  },
  {
    label: "Estadísticas por placa",
    values: { starter: false, business: true, pro: "Individuales" },
  },
  { label: "Panel de administración", values: { starter: true, business: true, pro: true } },
  {
    label: "Soporte",
    values: { starter: true, business: true, pro: "Prioritario" },
  },
  {
    label: "Placa adicional",
    values: { starter: "₡3.990", business: "₡3.490", pro: "₡2.990" },
  },
];
