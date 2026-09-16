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
/**
 * Logo del header del sitio comercial, con archivos dedicados por tema
 * (no el filtro `brightness-0 invert` de `BrandWordmark`): el negocio pidió
 * mantener el logo real de la marca en las dos versiones, navy+verde para
 * fondo claro y blanco+verde para fondo oscuro.
 *
 * Las dos imágenes conviven siempre en el DOM y el CSS decide cuál se ve
 * según `[data-theme]` en `<html>` — así el swap no depende de que React se
 * vuelva a renderizar, y no hay parpadeo al cambiar de tema. Se usa igual en
 * el header del home que en el resto: antes el home forzaba siempre la
 * versión oscura del logo (asumiendo que ahí abajo siempre había una foto
 * oscura), pero el hero ahora tiene un tratamiento claro real, así que el
 * logo tiene que responder al tema igual que todo lo demás.
 */
export function HeaderLogo({ className = "h-9 sm:h-10" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block w-auto ${className}`}
      style={{ aspectRatio: "602 / 154" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- asset local en /public */}
      <img
        src="/tapgocr-logo-header-claro.png"
        alt="TapGoCR"
        width={602}
        height={154}
        className="theme-logo-light absolute inset-0 size-full object-contain object-left"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- asset local en /public */}
      <img
        src="/tapgocr-logo-header-oscuro.png"
        alt="TapGoCR"
        width={564}
        height={144}
        className="theme-logo-dark absolute inset-0 size-full object-contain object-left"
      />
    </span>
  );
}

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
