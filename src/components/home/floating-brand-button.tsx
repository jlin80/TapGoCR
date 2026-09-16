import { BrandMark } from "@/components/brand";

/**
 * Botón flotante con el isotipo de TapGoCR, esquina inferior derecha.
 *
 * Solo el isotipo, sin texto: es un accesorio del sistema de producto, no un
 * segundo CTA compitiendo con "Comenzar ahora" del hero. Oculto en mobile
 * (`hidden sm:flex`) porque ahí ya existe el CTA fijo de `SiteFooter`
 * (`MobileStickyCta`) al pie de la pantalla — dos elementos flotantes
 * pisándose sería peor que ninguno.
 */
export function FloatingBrandButton() {
  return (
    <a
      href="#contacto"
      aria-label="Ir a la sección de contacto"
      title="Contactanos"
      className="tap-target-box fixed right-5 bottom-5 z-30 hidden size-14 items-center justify-center rounded-full bg-brand text-brand-contrast shadow-lg shadow-brand/30 transition-transform hover:scale-105 sm:flex"
    >
      {/* `mark.png` es el isotipo verde; sobre este botón verde se necesita en
          blanco. `brightness-0 invert` lo fuerza a blanco sólido sin generar
          un archivo nuevo ni tocar el asset original. */}
      <BrandMark className="size-7 brightness-0 invert" />
    </a>
  );
}
