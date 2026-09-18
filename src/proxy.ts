import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { appDomain, tagDomain, tapgoDomain, tapgoProtocol } from "@/lib/config";

/**
 * Los tres subdominios de producción sirven exactamente el mismo build (son
 * tres apps Passenger separadas que cargan el mismo `server.js`), así que
 * nada a nivel de infraestructura les impide responder rutas ajenas — por
 * ejemplo, hoy mismo `app.tapgocr.com/precios` carga perfectamente. Esta
 * función es la única barrera real: si la ruta pedida no es la que le
 * corresponde al dominio por el que entró la visita, redirige al dominio
 * correcto en vez de servirla ahí.
 *
 *   tapgoDomain (tapgocr.com, con alias www) → solo la landing comercial
 *   tagDomain   (go.tapgocr.com)             → solo /t/{code} (lo que abre el NFC/QR)
 *   appDomain   (app.tapgocr.com)            → solo /login, /registro, /app, /client
 *
 * Nunca se aplica en local (`tapgoDomain` empieza con "localhost"): ahí las
 * tres constantes son el mismo origen y no hay nada que redirigir.
 */
function isTagPath(pathname: string): boolean {
  return pathname === "/t" || pathname.startsWith("/t/");
}

function isAppPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/client")
  );
}

/**
 * Rutas técnicas que deben responder en cualquier dominio: assets de Next,
 * la API (incluye `/api/uploads/...`, referenciada con URL absoluta desde
 * páginas de otros dominios) y metadatos que los buscadores/navegadores
 * piden siempre al host que visitan, nunca a uno fijo.
 */
function isDomainExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png"
  );
}

function correctDomainFor(pathname: string): string {
  if (isTagPath(pathname)) return tagDomain;
  if (isAppPath(pathname)) return appDomain;
  return tapgoDomain;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const isLocalDomain = tapgoDomain.startsWith("localhost");

  // Solo se redirige navegación (GET/HEAD), nunca una mutación. Una Server
  // Action ("Aprobar", "Guardar cambios") es un POST al mismo pathname de la
  // página, con un header `Next-Action` — si esa pestaña quedó abierta desde
  // antes de este cambio de dominios (o alguien entró por un enlace viejo) y
  // el POST cae en el dominio "equivocado", redirigirlo 308 cross-origin con
  // ese header dispara un preflight CORS que el navegador no puede pasar, y
  // la acción falla con un error genérico en vez de ejecutarse. Como los tres
  // dominios corren el mismo código contra la misma base, dejar pasar la
  // mutación donde caiga es siempre seguro; lo único que se pierde es la
  // prolijidad de la URL, no la exclusividad real de cada dominio para
  // navegar (la próxima carga de página sí redirige).
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  if (!isLocalDomain && host && isNavigation && !isDomainExempt(pathname)) {
    const correctDomain = correctDomainFor(pathname);
    // `www.tapgocr.com` es un alias del dominio raíz, no una violación: solo
    // la landing comercial vive ahí también.
    const isOnCorrectDomain =
      host === correctDomain || (correctDomain === tapgoDomain && host === `www.${tapgoDomain}`);

    if (!isOnCorrectDomain) {
      const redirectUrl = new URL(request.url);
      redirectUrl.protocol = `${tapgoProtocol}:`;
      redirectUrl.hostname = correctDomain;
      // El setter de `.host` no siempre limpia un puerto explícito en la URL
      // original; en producción nunca hay uno (siempre 443), pero se limpia
      // igual para no arrastrar un puerto de un entorno que sí lo use.
      redirectUrl.port = "";
      return NextResponse.redirect(redirectUrl, 308);
    }
  }

  if (pathname.startsWith("/app") || pathname.startsWith("/client")) {
    const session = await auth();
    const role = session?.user?.role;

    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }

    if (pathname.startsWith("/app") && role !== UserRole.ROOT) {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }

    if (pathname.startsWith("/client") && role === UserRole.ROOT) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Antes solo corría en /app y /client (la comprobación de sesión). Ahora
  // tiene que ver toda petición de página para poder aplicar la separación
  // de dominios; los assets de Next quedan afuera del matcher directamente
  // en vez de solo en `isDomainExempt`, por rendimiento.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
