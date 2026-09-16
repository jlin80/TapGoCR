import type { CSSProperties } from "react";

import { LandingTheme } from "@/generated/prisma/enums";
import { contrastColor, shade } from "@/lib/color";

/**
 * Sistema de temas de la landing pública.
 *
 * Un solo árbol de componentes, cinco combinaciones de tokens — nunca cinco
 * páginas distintas. Cada tema define variables CSS (heredadas por todo lo de
 * adentro, igual que `themeStyle` ya hacía con el color de marca) más un
 * puñado de clases Tailwind que Tailwind no puede resolver desde una
 * variable (forma del avatar, radio de las cards, peso tipográfico).
 *
 * A propósito no se suma ninguna tipografía nueva: la landing la abre alguien
 * recién llegado por NFC o QR, casi siempre con datos móviles, y una fuente
 * externa sin cachear cuesta un salto de layout y un `<link>` más antes del
 * primer render. La personalidad de cada tema sale de espaciado, peso,
 * tracking y color — no de cargar una fuente distinta por cliente.
 */

export type ThemeTokens = {
  /** Radio de las cards de producto y botones grandes. */
  radius: string;
  /** Radio del avatar del negocio. */
  avatarRadius: string;
  /** Fondo detrás del contenido, cuando el tema es oscuro. */
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  /** Intensidad del degradado sobre la portada, de abajo hacia arriba. */
  coverOverlay: string;
  /** Peso y tracking del nombre del negocio. */
  heading: string;
  /** Clase de la etiqueta de categoría (eyebrow). */
  eyebrow: string;
};

const BASE: Record<LandingTheme, ThemeTokens> = {
  MINIMAL: {
    radius: "1.25rem",
    avatarRadius: "1.25rem",
    surface: "#ffffff",
    surfaceMuted: "#f7f7f5",
    text: "#18181b",
    textMuted: "#6b6b68",
    border: "#e9e9e6",
    coverOverlay: "linear-gradient(180deg, rgba(24,24,27,0) 55%, rgba(24,24,27,.55) 100%)",
    heading: "font-semibold tracking-tight",
    eyebrow: "font-medium tracking-wide",
  },
  TROPICAL: {
    radius: "1.5rem",
    avatarRadius: "9999px",
    surface: "#fffaf3",
    surfaceMuted: "#fdf2e2",
    text: "#2b2013",
    textMuted: "#8a7658",
    border: "#f0e2c8",
    coverOverlay:
      "linear-gradient(180deg, rgba(43,32,19,.05) 30%, rgba(43,32,19,.65) 100%)",
    heading: "font-semibold tracking-tight",
    eyebrow: "font-semibold tracking-widest uppercase",
  },
  ELEGANTE: {
    radius: "0.875rem",
    avatarRadius: "0.875rem",
    surface: "#141414",
    surfaceMuted: "#1c1c1c",
    text: "#f3f1ea",
    textMuted: "#a3a099",
    border: "#2c2c2a",
    coverOverlay: "linear-gradient(180deg, rgba(0,0,0,.15) 40%, rgba(0,0,0,.85) 100%)",
    heading: "font-semibold tracking-tight",
    eyebrow: "font-medium tracking-[0.2em] uppercase",
  },
  VIBRANTE: {
    radius: "1.75rem",
    avatarRadius: "1.75rem",
    surface: "#ffffff",
    surfaceMuted: "#fdf3ee",
    text: "#1f1a17",
    textMuted: "#7a6f68",
    border: "#f2e2d8",
    coverOverlay: "linear-gradient(180deg, rgba(31,26,23,0) 45%, rgba(31,26,23,.7) 100%)",
    heading: "font-bold tracking-tight",
    eyebrow: "font-bold tracking-wide uppercase",
  },
  BOUTIQUE: {
    radius: "0.5rem",
    avatarRadius: "0.5rem",
    surface: "#fbfaf8",
    surfaceMuted: "#f1efe9",
    text: "#22201c",
    textMuted: "#7d766a",
    border: "#e6e2d8",
    coverOverlay: "linear-gradient(180deg, rgba(34,32,28,.05) 40%, rgba(34,32,28,.6) 100%)",
    heading: "font-medium tracking-tight",
    eyebrow: "font-medium tracking-[0.25em] uppercase",
  },
};

/** Color de acento por defecto de cada tema, cuando el negocio no fijó uno propio. */
const DEFAULT_ACCENT: Record<LandingTheme, string> = {
  MINIMAL: "#0d9488",
  TROPICAL: "#e08a3e",
  ELEGANTE: "#c9a063",
  VIBRANTE: "#e0483e",
  BOUTIQUE: "#8a7a5c",
};

export const THEME_LABELS: Record<LandingTheme, string> = {
  MINIMAL: "Minimal — claro y limpio",
  TROPICAL: "Tropical — cálido, fotos grandes",
  ELEGANTE: "Elegante — oscuro y sofisticado",
  VIBRANTE: "Vibrante — colores fuertes",
  BOUTIQUE: "Boutique — editorial, hotelero",
};

export function landingThemeStyle(
  theme: LandingTheme,
  brandColor: string | null,
  accentColor: string | null,
): CSSProperties {
  const tokens = BASE[theme];
  const brand = brandColor ?? DEFAULT_ACCENT[theme];

  return {
    // Nombres alineados a los tokens Tailwind ya registrados en `globals.css`
    // (`@theme inline`: --color-surface, --color-muted, etc.) — así
    // `bg-surface`, `text-muted`, `border-border` heredan el tema sin que
    // ningún componente necesite una clase nueva.
    "--radius": tokens.radius,
    "--avatar-radius": tokens.avatarRadius,
    "--surface": tokens.surface,
    "--surface-muted": tokens.surfaceMuted,
    "--foreground": tokens.text,
    "--muted": tokens.textMuted,
    "--border": tokens.border,
    "--cover-overlay": tokens.coverOverlay,
    "--brand": brand,
    "--brand-strong": accentColor ?? shade(brand, -0.15),
    "--brand-contrast": contrastColor(brand),
    backgroundColor: tokens.surface,
    color: tokens.text,
  } as CSSProperties;
}

export function themeClasses(theme: LandingTheme): Pick<ThemeTokens, "heading" | "eyebrow"> {
  return BASE[theme];
}
