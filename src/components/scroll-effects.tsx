"use client";

import { useLayoutEffect } from "react";

/**
 * Respaldo de los efectos de scroll para navegadores sin `animation-timeline`.
 *
 * Chrome y Edge animan con el scroll desde CSS y no necesitan nada de esto; en
 * Firefox y Safari este componente reproduce los mismos efectos con
 * IntersectionObserver y un listener de scroll.
 *
 * El orden importa: se marca lo que ya está en pantalla ANTES de activar la
 * clase que oculta, y todo dentro de `useLayoutEffect`, que corre antes del
 * pintado. Así no hay parpadeo. Si el JavaScript nunca llega a ejecutarse, la
 * clase no se agrega y la página queda visible y quieta, que es el estado
 * correcto por defecto.
 */
export function ScrollEffects() {
  useLayoutEffect(() => {
    const supportsNative =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");

    if (supportsNative) return;

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .zoom-in"),
    );

    // Lo que ya se ve no debe animarse: aparecería de la nada al cargar.
    const alreadyVisible = new Set<HTMLElement>();
    for (const element of targets) {
      const box = element.getBoundingClientRect();
      if (reduced || (box.top < window.innerHeight && box.bottom > 0)) {
        element.classList.add("is-visible");
        alreadyVisible.add(element);
      }
    }

    root.classList.add("scroll-js");

    let observer: IntersectionObserver | undefined;

    if (!reduced) {
      observer = new IntersectionObserver(
        (entries, self) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            self.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
      );

      for (const element of targets) {
        if (!alreadyVisible.has(element)) observer.observe(element);
      }
    }

    // Progreso de lectura y parallax, leídos una vez por cuadro.
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = root.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--scroll-y", String(Math.round(window.scrollY)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("scroll-js");
    };
  }, []);

  return null;
}
