"use client";

import { useEffect, useState } from "react";

import { cx } from "@/components/ui";

const STORAGE_KEY = "tapgocr-theme";

/**
 * Switch de tema claro/oscuro.
 *
 * No usa contexto de React a propósito: el atributo `data-theme` en
 * `<html>` (fijado antes de hidratar, ver `layout.tsx`) ya es la única
 * fuente de verdad que necesita cualquier CSS del sitio — un logo, un
 * ícono, un token de color. Este botón solo lo lee al montar (para que
 * `aria-pressed` sea correcto) y lo escribe al hacer click.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Sincroniza con el atributo que puso el script anti-flash del <head>
    // (corre antes de hidratar, así que el DOM ya tiene el tema real acá).
    // No hay forma de leerlo en el render inicial sin desincronizar del HTML
    // que ya mandó el servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin storage disponible (privado/bloqueado): el tema igual cambia
      // para esta visita, simplemente no se recuerda para la próxima.
    }
    setIsDark(next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-pressed={isDark ?? undefined}
      className="tap-target relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-muted text-muted transition-colors hover:text-foreground"
    >
      {/* Los dos íconos siempre están en el DOM; la opacidad/rotación los
          cruza sin depender de que `isDark` ya se haya resuelto (evita un
          parpadeo de "sin ícono" durante el primer render del cliente). */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cx(
          "absolute size-[1.15rem] transition-all duration-300",
          isDark === false
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-50 opacity-0",
        )}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v1.5M12 19.5V21M4.6 4.6l1 1M18.4 18.4l1 1M3 12h1.5M19.5 12H21M4.6 19.4l1-1M18.4 5.6l1-1" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cx(
          "absolute size-[1.15rem] transition-all duration-300",
          isDark !== false
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-50 opacity-0",
        )}
      >
        <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
      </svg>
    </button>
  );
}
