import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandWordmark } from "@/components/brand";
import { Card } from "@/components/ui";
import { UserRole } from "@/generated/prisma/enums";
import { getSessionUser } from "@/lib/authz";
import { appName } from "@/lib/config";
import { safeInternalPath } from "@/lib/safe-redirect";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === UserRole.ROOT ? "/app/dashboard" : "/client/dashboard");
  }

  const params = await searchParams;
  const raw = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <BrandWordmark />
        </div>

        <Card>
          <h1 className="text-lg font-semibold">Ingresar</h1>
          <p className="mt-1 mb-5 text-sm text-muted">
            Accedé al panel de {appName}.
          </p>
          <LoginForm callbackUrl={safeInternalPath(raw, "")} />

          <p className="mt-5 text-center text-sm text-muted">
            ¿Todavía no sos cliente?{" "}
            <Link href="/registro" className="text-brand hover:underline">
              Registrá tu negocio
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
