// Config en JavaScript plano, a propósito: el hosting compartido no puede
// cargar el binario nativo de SWC (glibc vieja) y su fallback WASM se rompe
// en este host, y Next.js necesita SWC para transpilar `next.config.ts` en
// cada arranque del servidor — no solo en el build. Un `.ts` acá tumba la
// app entera al primer restart aunque el `.next` ya esté compilado.
// Ver next.config.ts.bak (referencia) y CLAUDE.md/AGENTS.md.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `HeroSection` pide `quality={90}` para la foto de la placa: Next 16
    // rechaza cualquier valor de `quality` no declarado acá.
    qualities: [75, 90],
  },
  experimental: {
    // Habilita `forbidden()`, que devuelve un 403 real en lugar de un 404 o una
    // redirección. Es el criterio de aceptación del panel de cliente: un CLIENT
    // que manipule la URL de otro negocio debe recibir 403.
    authInterrupts: true,
    // Next.js corta el body de una Server Action en 1 MB por defecto, sin
    // relación con `MAX_UPLOAD_BYTES` (que sí puede llegar a 10 MB, ver
    // `lib/uploads.ts`). Sin esto, subir un logo o una portada que pese más
    // de 1 MB tumbaba la request con un error genérico antes de que el
    // código de validación llegara siquiera a ejecutarse.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // La landing pública puede llegar detrás de un reverse proxy; se confía en las
  // cabeceras estándar para resolver el host.
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          // `interest-cohort` (FLoC) ya no existe en ningún navegador; dejarlo
          // solo generaba "Unrecognized feature" en la consola sin bloquear nada.
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        { key: "Content-Security-Policy", value: contentSecurityPolicy() },
      ],
    },
  ],
};

/**
 * CSP sin nonces.
 *
 * `script-src` necesita 'unsafe-inline' porque Next.js inyecta el payload de
 * hidratación en línea; una política con nonce exigiría generar y propagar el
 * nonce desde el proxy en cada respuesta. Aun así la política aporta: bloquea
 * scripts de terceros, embebidos, el secuestro de <base> y el envío de
 * formularios a dominios ajenos.
 *
 * `img-src` admite https: porque el logo de un negocio es una URL remota
 * arbitraria cargada por el administrador.
 */
function contentSecurityPolicy() {
  // Cloudflare Web Analytics: el beacon que Cloudflare inyecta solo en el
  // borde (no está en este código, se activa desde su dashboard). Se permite
  // a propósito, no por accidente — es del propio Cloudflare, no un tercero
  // ajeno, y es la única excepción de terceros en todo este CSP.
  const cloudflareBeacon = "https://static.cloudflareinsights.com";
  const cloudflareBeaconReport = "https://cloudflareinsights.com";

  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? `'self' 'unsafe-inline' 'unsafe-eval' ${cloudflareBeacon}`
      : `'self' 'unsafe-inline' ${cloudflareBeacon}`;

  // nginx redirige /login, /registro, /app y /client del dominio raíz hacia
  // app.{dominio} (ver deploy/nginx.multisite.conf.example). El <Link> de
  // Next.js precarga esas rutas con fetch() antes de que la persona haga
  // clic; ese fetch sigue la redirección y termina apuntando a otro origen, así
  // que connect-src tiene que confiarlo explícitamente o el navegador lo
  // bloquea (ruidoso en consola, y en algunos casos rompe la navegación
  // instantánea, cayendo a una recarga completa). go.{dominio} entra por la
  // misma razón: ahí redirige /t/{code}.
  const domain = process.env.NEXT_PUBLIC_TAPGO_DOMAIN?.trim();
  const ownOrigins = domain ? `https://app.${domain} https://go.${domain}` : "";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self'${ownOrigins ? ` ${ownOrigins}` : ""} ${cloudflareBeaconReport}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export default nextConfig;
