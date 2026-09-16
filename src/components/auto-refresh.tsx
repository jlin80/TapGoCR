"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los Server Components de la pantalla actual sin recargar la
 * página entera ni perder el scroll: al volver a la pestaña (cambiar de
 * ventana y volver) y cada cierto tiempo mientras sigue abierta.
 *
 * Antes, una pestaña de ROOT o CLIENT abierta hace rato se quedaba mostrando
 * los datos de cuando se cargó — una alta nueva, una consulta o una placa
 * recién escaneada no aparecían hasta que alguien forzaba un refresh a mano.
 * No es tiempo real (para eso haría falta un socket), pero cubre el caso real:
 * "dejé el panel abierto y algo nuevo no aparece".
 *
 * El refresco por temporizador NO cuenta como actividad de la persona: cada
 * `router.refresh()` es un request real que pasa por el middleware de sesión,
 * y Auth.js renueva el JWT ante cualquier request dentro de la ventana de
 * `updateAge` (`src/lib/auth.ts`). Sin este cuidado, una pestaña abierta y
 * visible —aunque nadie la toque— se refresca sola cada 60s, mucho más
 * seguido que esa ventana, y la sesión nunca vence por inactividad real. Por
 * eso el temporizador solo refresca si hubo una señal real de la persona
 * (mouse, teclado, toque) en los últimos `activityWindowMs`. Volver a la
 * pestaña (focus/visibilitychange) sí refresca siempre: ese evento ya es en
 * sí mismo una acción real, no algo que dispare solo un timer.
 */
export function AutoRefresh({
  intervalMs = 60_000,
  activityWindowMs = 2 * 60_000,
}: {
  intervalMs?: number;
  activityWindowMs?: number;
}) {
  const router = useRouter();
  const lastActivityRef = useRef<number | null>(null);

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    // Al montar cuenta como actividad: recién se abrió o se navegó a esta
    // pantalla, así que el primer tramo de `activityWindowMs` sí refresca.
    markActivity();

    function refreshIfVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }

    function refreshIfRecentlyActive() {
      const lastActivity = lastActivityRef.current ?? 0;
      if (Date.now() - lastActivity < activityWindowMs) refreshIfVisible();
    }

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    for (const event of activityEvents) {
      window.addEventListener(event, markActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    const interval = setInterval(refreshIfRecentlyActive, intervalMs);

    return () => {
      for (const event of activityEvents) {
        window.removeEventListener(event, markActivity);
      }
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      clearInterval(interval);
    };
  }, [router, intervalMs, activityWindowMs]);

  return null;
}
