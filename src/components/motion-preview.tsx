"use client";

import { useEffect } from "react";

/**
 * Vista previa del movimiento, para revisar el sitio desde una máquina que
 * tiene las animaciones desactivadas.
 *
 * El sitio respeta `prefers-reduced-motion` y así debe seguir: quien pidió menos
 * movimiento no lo recibe. El problema práctico es otro: en Windows, «efectos de
 * animación» es un único interruptor del sistema, así que quien lo apaga por
 * rendimiento —no por una condición vestibular— tampoco puede ver su propio
 * sitio como lo ven sus visitantes.
 *
 * Con `?motion=on` en la URL se fuerza el movimiento solo en esa pestaña. Es
 * explícito, no se recuerda entre visitas y ningún cliente final llega con ese
 * parámetro: no relaja la accesibilidad de nadie, solo permite revisar y mostrar
 * el sitio.
 *
 *   https://tapgocr.com/?motion=on
 */
export function MotionPreview() {
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("motion") === "on";
    if (!forced) return;

    document.documentElement.classList.add("force-motion");
    return () => document.documentElement.classList.remove("force-motion");
  }, []);

  return null;
}
