import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

/**
 * Comprobaciones optimistas de enrutado.
 *
 * Esto NO es la capa de autorización: solo evita que un usuario aterrice en un
 * panel que no le corresponde. La autorización real vive en `src/lib/authz.ts`
 * y se aplica en cada página y cada server action.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/client/:path*"],
};
