/**
 * Marca de TapGoCR.
 *
 * `mark.png` (isotipo solo) y `logo.png` (isotipo + nombre) son los archivos
 * oficiales, con fondo transparente, servidos desde /public para evitar el
 * pipeline de optimización de next/image en assets que ya vienen comprimidos
 * y no cambian de tamaño dinámicamente — mismo criterio que los demo-logos de
 * `phone-showcase.tsx`.
 */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local en /public, no hace falta next/image acá
    <img
      src="/brand/mark.png"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={className}
    />
  );
}

/**
 * Logo completo (isotipo + nombre) en una sola imagen. Proporción 700:416.
 *
 * `logo.png` trae el nombre en navy + verde, pensado para fondos claros. El
 * sistema de marca define una versión clara para fondos oscuros, pero no hay
 * un archivo aparte para ella todavía: `light` fuerza blanco sólido con un
 * filtro CSS (`brightness-0 invert`) en vez de inventar/generar un asset
 * nuevo. Se usa donde el logo cae sobre el hero fotográfico (navbar del home).
 */
export function BrandWordmark({
  className = "h-12 sm:h-14",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local en /public, no hace falta next/image acá
    <img
      src="/brand/logo.png"
      alt="TapGoCR"
      width={700}
      height={416}
      className={`w-auto ${light ? "brightness-0 invert" : "brand-logo"} ${className}`}
    />
  );
}
