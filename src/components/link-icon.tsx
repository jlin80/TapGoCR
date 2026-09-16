import { LinkType } from "@/generated/prisma/enums";

/**
 * Iconografía de los enlaces de la landing.
 *
 * Se usan glifos genéricos dibujados a mano en lugar de los logotipos de las
 * marcas: evita depender de una librería de iconos y de reproducir marcas
 * registradas. Cuando TapGoCR tenga una licencia de iconos, basta con sustituir
 * este componente.
 */
const PATHS: Record<LinkType, string> = {
  // Documento con líneas: menú/carta.
  MENU: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 1.5V8h3.5M9 12h7M9 16h5",
  // Globo de conversación.
  WHATSAPP: "M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.7 8.7 0 0 1-3.9-.9L3 20.5l1.7-4.5a8.2 8.2 0 0 1-1.2-4.3A8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3Z",
  // Cámara.
  INSTAGRAM: "M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-2h6.6l1 2h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Zm8 8.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  // Nota musical.
  TIKTOK: "M9 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3-3V4l3.5 2.2M12 8.5l6 3.6",
  // Dos personas.
  FACEBOOK: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19a6 6 0 0 1 12 0M16 13.5a5 5 0 0 1 5 5.5",
  // Estrella.
  GOOGLE_REVIEWS: "m12 4 2.5 5.2 5.5.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.5-.8L12 4Z",
  // Marcador de mapa.
  GOOGLE_MAPS: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  // Globo terráqueo.
  WEBSITE: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c-2.5 2.4-3.8 5.4-3.8 9s1.3 6.6 3.8 9c2.5-2.4 3.8-5.4 3.8-9S14.5 5.4 12 3ZM3.5 9.5h17M3.5 14.5h17",
  // Auricular de teléfono.
  PHONE: "M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z",
  // Libro abierto.
  CATALOG: "M12 6.5S10 4.5 4.5 5v13c5.5-.5 7.5 1.5 7.5 1.5s2-2 7.5-1.5V5c-5.5-.5-7.5 1.5-7.5 1.5Zm0 0v13",
  // Eslabón de cadena.
  CUSTOM: "M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2",
};

export function LinkIcon({
  type,
  className = "size-6",
}: {
  type: LinkType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[type]} />
    </svg>
  );
}
