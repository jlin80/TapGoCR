"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { UserRole } from "@/generated/prisma/enums";
import { resolveIdentifier } from "@/lib/client-code";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeInternalPath } from "@/lib/safe-redirect";

export type LoginState = { error?: string };

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Ingresá tu correo o tu código de cliente.")
    .max(254),
  password: z.string().min(1, "Ingresá tu contraseña.").max(200),
});

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    identifier: String(formData.get("identifier") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const identifier = resolveIdentifier(parsed.data.identifier);

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if ("code" in error && error.code === "rate_limited") {
        return {
          error: "Demasiados intentos fallidos. Esperá unos minutos y probá de nuevo.",
        };
      }

      // Mensaje idéntico para contraseña incorrecta y cuenta inexistente: no se
      // confirma qué correos están registrados.
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Los datos de acceso no son correctos."
            : "No se pudo iniciar sesión. Intentá de nuevo.",
      };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where:
      identifier.kind === "code"
        ? { clientCode: identifier.value }
        : { email: identifier.value },
    select: { role: true },
  });

  const home = user?.role === UserRole.ROOT ? "/app/dashboard" : "/client/dashboard";
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  redirect(safeInternalPath(callbackUrl || null, home));
}
