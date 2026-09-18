import { appName, showBranding } from "@/lib/config";

/**
 * Piezas visuales de la landing pública.
 *
 * Se mantienen fuera de `src/components/ui.tsx` a propósito: aquello son las
 * primitivas de los paneles, y la landing es la única superficie que un cliente
 * final ve. Mezclarlas haría que un cambio de estilo del panel se filtrara a la
 * página que se abre desde una placa.
 *
 * Los colores y la forma vienen de `landingThemeStyle` (`src/lib/theme.ts`),
 * inyectados como variables CSS en el contenedor de la página — estos
 * componentes solo las consumen vía clases Tailwind (`bg-surface`,
 * `rounded-[var(--avatar-radius)]`, etc.), nunca un valor fijo.
 */

/**
 * Imagen de portada, a sangre completa sobre el ancho de la tarjeta, con un
 * degradado hacia el fondo del tema para que el nombre del negocio se lea
 * bien encima sin importar la foto.
 *
 * Siempre 16:9 — antes el mobile forzaba un recorte a 4:3 con `object-cover`,
 * y una portada pensada y subida en 16:9 (ver el hint del campo de carga)
 * perdía sus bordes izquierdo y derecho en un teléfono: exactamente donde
 * suele vivir texto o un elemento visual. `object-contain` muestra la imagen
 * completa siempre, sin importar el ancho de pantalla; si algún negocio subió
 * una portada que no es exactamente 16:9, el sobrante se rellena con
 * `bg-surface-muted` en vez de recortarse.
 *
 * Se usa `<img>` y no `next/image` por el mismo motivo que el logo: la URL la
 * pone el negocio y puede apuntar a cualquier host, lo que exigiría mantener
 * una lista de dominios permitidos en la configuración de Next.
 *
 * `fetchPriority="high"` porque es el elemento más grande de la primera
 * pantalla: es lo que decide el LCP en un teléfono con datos móviles.
 */
export function BusinessCover({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  if (!url) return null;

  return (
    <div className="relative -mx-5 mb-0 aspect-video w-[calc(100%+2.5rem)] overflow-hidden bg-surface-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Portada de ${name}`}
        className="size-full object-contain"
        fetchPriority="high"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "var(--cover-overlay)" }}
      />
    </div>
  );
}

export function BusinessAvatar({
  name,
  logoUrl,
  size = "size-20",
}: {
  name: string;
  logoUrl: string | null;
  /** Clase de tamaño Tailwind. Distinta en la landing (grande) y en subpáginas. */
  size?: string;
}) {
  if (logoUrl) {
    // Imagen remota arbitraria cargada por el negocio: se usa <img> en lugar de
    // next/image para no exigir configuración de dominios permitidos.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        width={80}
        height={80}
        className={`${size} shrink-0 rounded-[var(--avatar-radius,1.25rem)] border-4 border-surface bg-surface object-cover shadow-sm`}
        fetchPriority="high"
        decoding="async"
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-[var(--avatar-radius,1.25rem)] border-4 border-surface bg-brand text-2xl font-semibold text-brand-contrast`}
    >
      {initials || "?"}
    </div>
  );
}

export function InactiveTag() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="size-7"
          aria-hidden="true"
        >
          <path d="M12 8v5M12 16.5h.01M12 3.5 21 20H3L12 3.5Z" />
        </svg>
      </div>
      <h1 className="mt-5 text-lg font-semibold">Este tag está temporalmente inactivo.</h1>
      <p className="mt-2 text-sm text-muted">
        Si creés que se trata de un error, contactá al negocio.
      </p>
      {showBranding ? (
        <p className="mt-10 text-xs text-muted">Powered by {appName}</p>
      ) : null}
    </main>
  );
}
