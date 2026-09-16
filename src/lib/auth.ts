import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { resolveIdentifier } from "@/lib/client-code";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

// Cierre de sesión por inactividad: si no hay ninguna acción en 30 minutos, el
// JWT vence y `proxy.ts` manda de vuelta a /login en la siguiente request. Con
// actividad, `auth()` renueva el token cada `SESSION_UPDATE_AGE` como mucho,
// así que en uso normal la sesión no se corta, pero un panel dejado abierto sí.
const SESSION_MAX_AGE = 30 * 60;
const SESSION_UPDATE_AGE = 5 * 60;

/**
 * Hash de referencia para gastar el mismo tiempo cuando el correo no existe.
 * Sin esto, la diferencia de latencia revela qué cuentas están registradas.
 * Se calcula una sola vez, en el primer intento de login, para no penalizar el
 * arranque del proceso.
 */
let dummyHash: string | null = null;

function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync("tapgocr-timing-equalizer", 12);
  return dummyHash;
}

const credentialsSchema = z.object({
  // Se admite el correo o el código de cliente: el identificador lo asigna el
  // sistema, así que no todos recuerdan con cuál se registraron.
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200),
});

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE, updateAge: SESSION_UPDATE_AGE },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Correo o código de cliente", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const identifier = resolveIdentifier(parsed.data.identifier);

        // El límite se aplica por identificador, antes de tocar la base.
        const limit = rateLimit(
          `login:${identifier.kind}:${identifier.value}`,
          LOGIN_ATTEMPTS,
          LOGIN_WINDOW_MS,
        );
        if (!limit.allowed) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({
          where:
            identifier.kind === "code"
              ? { clientCode: identifier.value }
              : { email: identifier.value },
        });

        // Siempre se ejecuta una comparación, exista o no la cuenta.
        const matches = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? getDummyHash(),
        );

        if (!user || !user.active || !matches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      return session;
    },
  },
});
