import { LinkType } from "@/generated/prisma/enums";

/** Etiqueta por defecto y orden sugerido de cada tipo de enlace. */
export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  MENU: "Menú",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  FACEBOOK: "Facebook",
  GOOGLE_REVIEWS: "Google Reviews",
  GOOGLE_MAPS: "Cómo llegar",
  WEBSITE: "Sitio web",
  PHONE: "Llamar",
  CATALOG: "Catálogo",
  CUSTOM: "Enlace",
};

/** Orden en el que se ofrecen los tipos en los formularios. */
export const LINK_TYPE_ORDER: LinkType[] = [
  LinkType.MENU,
  LinkType.WHATSAPP,
  LinkType.INSTAGRAM,
  LinkType.TIKTOK,
  LinkType.FACEBOOK,
  LinkType.GOOGLE_REVIEWS,
  LinkType.GOOGLE_MAPS,
  LinkType.WEBSITE,
  LinkType.PHONE,
  LinkType.CATALOG,
  LinkType.CUSTOM,
];

// Los identificadores sintéticos de los botones derivados viven en
// `src/lib/landing.ts`, junto a la lógica que decide cuáles se muestran.
