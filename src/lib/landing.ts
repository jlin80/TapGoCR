import { LinkType } from "@/generated/prisma/enums";

/**
 * Composición de los botones de la landing pública.
 *
 * Fuente única de verdad, usada por la página (`/t/[code]`) y por el redirector
 * (`/t/[code]/go/[linkId]`). Que ambos deriven la lista del mismo sitio es lo
 * que garantiza que el redirector no pueda resolver un destino que la página no
 * mostraría: no hay dos criterios que puedan desincronizarse.
 *
 * Regla del producto: un botón aparece únicamente si tiene una configuración
 * válida. Un negocio sin TikTok no muestra el botón de TikTok.
 */

/**
 * Identificadores sintéticos de los botones derivados de los datos del negocio,
 * en lugar de una fila en BusinessLink.
 *
 * Son palabras cortas y en minúsculas; los ids reales son cuid de 25 caracteres
 * que empiezan por `c`, así que no hay forma de que colisionen.
 */
export const DERIVED_IDS = {
  WEBSITE: "website",
  WHATSAPP: "whatsapp",
  PHONE: "phone",
  MAPS: "maps",
} as const;

/** Compatibilidad: nombre anterior del botón derivado del sitio web. */
export const WEBSITE_FALLBACK_ID = DERIVED_IDS.WEBSITE;

/** Destino sintético del menú nativo en analytics. Ver `TARGET_LABELS`. */
export const MENU_NATIVE_TARGET = "MENU_NATIVE";

/**
 * Descarta peticiones que no pueden corresponder a un código real antes de
 * tocar la base de datos.
 *
 * La landing es la superficie más expuesta del proyecto y recibe rastreo de
 * rutas a ciegas; este filtro evita una consulta por cada intento.
 */
export function isPlausibleCode(code: string): boolean {
  return code.length >= 6 && code.length <= 32 && /^[A-Za-z0-9]+$/.test(code);
}

export type LandingBusiness = {
  phone: string | null;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  links: Array<{ id: string; type: LinkType; label: string; url?: string }>;
};

export type LandingButton = {
  id: string;
  type: LinkType;
  label: string;
  /** Destino final. Solo lo usa el redirector; la página no lo renderiza. */
  url: string;
  /** Valor guardado en `ScanEvent.target`. */
  target: string;
};

export type LandingOptions = {
  /**
   * El menú nativo está publicado y la landing ya muestra su propio botón.
   *
   * En ese caso los enlaces de tipo MENU se omiten: si no, la landing enseñaría
   * dos botones "Ver menú", uno hacia la carta de TapGoCR y otro hacia el PDF
   * viejo. El enlace no se borra —el negocio puede volver al modo enlace cuando
   * quiera—, solo deja de mostrarse.
   */
  nativeMenuActive?: boolean;
};

/**
 * Botones de un negocio, en el orden en que se muestran.
 *
 * Primero los enlaces que el negocio administra explícitamente, respetando su
 * orden; después los derivados de sus datos de contacto. Un derivado se omite
 * cuando ya existe un enlace explícito del mismo tipo: el que configuró la
 * persona manda sobre el automático.
 */
/**
 * Tipos de enlace que se muestran como acción rápida (icono, fila
 * horizontal) en vez de como fila de la lista principal. Son los contactos
 * directos: llamar, escribir, llegar, seguir en una red. El resto (menú
 * como enlace, sitio web, catálogo, reseñas, enlaces propios) va en la lista
 * de abajo, donde el texto del botón tiene espacio para explicarse.
 */
const QUICK_ACTION_TYPES: ReadonlySet<LinkType> = new Set([
  LinkType.WHATSAPP,
  LinkType.PHONE,
  LinkType.GOOGLE_MAPS,
  LinkType.INSTAGRAM,
  LinkType.FACEBOOK,
  LinkType.TIKTOK,
]);

/** Separa los botones ya armados en acciones rápidas y enlaces secundarios. */
export function splitButtons(buttons: LandingButton[]): {
  quickActions: LandingButton[];
  secondary: LandingButton[];
} {
  const quickActions: LandingButton[] = [];
  const secondary: LandingButton[] = [];

  for (const button of buttons) {
    (QUICK_ACTION_TYPES.has(button.type) ? quickActions : secondary).push(button);
  }

  return { quickActions, secondary };
}

export function landingButtons(
  business: LandingBusiness,
  options: LandingOptions = {},
): LandingButton[] {
  const links = options.nativeMenuActive
    ? business.links.filter((link) => link.type !== LinkType.MENU)
    : business.links;

  const buttons: LandingButton[] = links.map((link) => ({
    id: link.id,
    type: link.type,
    label: link.label,
    url: link.url ?? "",
    target: link.type,
  }));

  const present = new Set(links.map((link) => link.type));

  for (const derived of derivedButtons(business)) {
    if (present.has(derived.type)) continue;
    buttons.push(derived);
  }

  return buttons;
}

/**
 * Botones que salen de los datos del negocio y no de una fila en BusinessLink.
 *
 * El de sitio web existía desde antes y es lo que hace que, al completar el
 * servicio de desarrollo web, el botón aparezca solo en la landing. Los de
 * WhatsApp, llamada y mapa siguen el mismo criterio con los datos que TapGoCR
 * ya carga al dar de alta al negocio.
 */
function derivedButtons(business: LandingBusiness): LandingButton[] {
  const buttons: LandingButton[] = [];

  const whatsapp = whatsappUrl(business.whatsapp);
  if (whatsapp) {
    buttons.push({
      id: DERIVED_IDS.WHATSAPP,
      type: LinkType.WHATSAPP,
      label: "Escribinos por WhatsApp",
      url: whatsapp,
      target: LinkType.WHATSAPP,
    });
  }

  const phone = phoneUrl(business.phone);
  if (phone) {
    buttons.push({
      id: DERIVED_IDS.PHONE,
      type: LinkType.PHONE,
      label: "Llamar",
      url: phone,
      target: LinkType.PHONE,
    });
  }

  const maps = mapsUrl(business.latitude, business.longitude);
  if (maps) {
    buttons.push({
      id: DERIVED_IDS.MAPS,
      type: LinkType.GOOGLE_MAPS,
      label: "Cómo llegar",
      url: maps,
      target: LinkType.GOOGLE_MAPS,
    });
  }

  if (business.websiteUrl) {
    buttons.push({
      id: DERIVED_IDS.WEBSITE,
      type: LinkType.WEBSITE,
      label: "Sitio web",
      url: business.websiteUrl,
      target: LinkType.WEBSITE,
    });
  }

  return buttons;
}

/**
 * `wa.me` exige el número en formato internacional y solo dígitos.
 *
 * Se descartan los números demasiado cortos para ser un internacional válido:
 * un campo con "8888-7777" (sin código de país) produciría un enlace roto, y un
 * botón que no funciona es peor que no tenerlo.
 */
export function whatsappUrl(value: string | null): string | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;

  return `https://wa.me/${digits}`;
}

/** Teléfono para marcar. Acepta el `+` inicial y descarta el resto de signos. */
export function phoneUrl(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return null;

  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * Coordenadas a un enlace de Google Maps.
 *
 * Se usa la búsqueda por coordenadas y no por dirección de texto: la dirección
 * escrita a mano lleva a Maps al lugar equivocado con demasiada frecuencia.
 */
export function mapsUrl(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude === null || longitude === null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
