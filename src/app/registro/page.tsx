import type { Metadata } from "next";
import Link from "next/link";

import { BrandWordmark } from "@/components/brand";
import { RegistrationForm } from "@/components/registration-form";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Registrá tu negocio en TapGoCR. Completás tus datos y tu panel queda listo al instante.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/registro" },
};

/**
 * Alta pública de clientes.
 *
 * El registro es automático: apenas se completa el formulario, la cuenta y
 * el negocio quedan creados y la persona puede entrar de inmediato con el
 * correo y la contraseña que eligió. Coordinar la instalación física de las
 * placas sigue siendo un paso aparte, después del alta.
 */
export default function RegistroPage() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3.5">
          {/*
            Un <a> normal, no <Link>: esta página se sirve en app.{dominio}
            (nginx redirige /registro ahí), y "/" vive en el dominio raíz. Un
            <Link> intentaría una transición de cliente cross-origin que el
            navegador bloquea por CORS.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">
            <BrandWordmark />
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Registrá tu negocio
          </h1>
          <p className="mt-3 text-muted">
            Completá tus datos y los de tu negocio. Tu cuenta y tu panel quedan
            listos al instante — después coordinamos la instalación de las
            placas.
          </p>
        </div>

        <RegistrationForm />

        <p className="mt-8 text-center text-sm text-muted">
          ¿Preferís hablar primero?{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /#contacto vive en el dominio raíz; ver comentario del logo arriba */}
          <a href="/#contacto" className="text-brand hover:underline">
            Escribinos
          </a>{" "}
          y te armamos una propuesta.
        </p>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-muted">
          <span>
            {appName} · NFC y QR para negocios
          </span>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- ver comentario del logo arriba */}
          <a href="/" className="hover:text-foreground">
            Volver al inicio
          </a>
        </div>
      </footer>
    </>
  );
}
