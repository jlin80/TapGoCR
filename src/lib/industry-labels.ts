import { Industry } from "@/generated/prisma/enums";

/**
 * Nombre e ícono de cada rubro, en un solo lugar.
 *
 * Lo usan el selector visual del registro (`registration-form.tsx`), el
 * formulario de ROOT (`business-fields.tsx`) y cualquier vista que solo
 * necesite mostrar el rubro ya elegido (`client/business`). Un emoji alcanza
 * como ícono: es texto, no un asset que mantener.
 */
export const INDUSTRY_LABELS: Record<Industry, string> = {
  RESTAURANTES: "Restaurante",
  CAFETERIAS: "Cafetería",
  BARBERIAS: "Barbería o salón",
  HOTELES: "Hotel u hospedaje",
  GIMNASIOS: "Gimnasio",
  TIENDAS: "Tienda",
  OTRO: "Otro",
};

export const INDUSTRY_ICONS: Record<Industry, string> = {
  RESTAURANTES: "🍽️",
  CAFETERIAS: "☕",
  BARBERIAS: "💈",
  HOTELES: "🏨",
  GIMNASIOS: "💪",
  TIENDAS: "🛍️",
  OTRO: "✨",
};
