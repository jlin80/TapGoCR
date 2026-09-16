import Link from "next/link";

import { Blobs, PackageCard, SectionHeading } from "@/components/marketing";
import { PACKAGES } from "@/lib/packages";

/**
 * Paquetes comerciales.
 *
 * Los datos viven en `src/lib/packages.ts`: los comparte esta sección y cada
 * página de desglose en `/paquetes/{slug}`.
 */
export function PackagesSection() {
  return (
    <section id="paquetes" className="on-dark relative overflow-hidden border-b border-border">
      <Blobs />

      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-24 lg:py-28">
        <SectionHeading
          eyebrow="Paquetes"
          title="Elegí hasta dónde querés llegar"
          description="Se empieza por lo básico y se agrega lo demás cuando haga falta. Cada paquete incluye todo lo del anterior."
        />

        <ul className="mt-12 grid sm:mt-16 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map((item) => (
            <PackageCard key={item.slug} {...item} />
          ))}
        </ul>

        <p className="reveal mt-12 text-center text-muted">
          Cada negocio es distinto.{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
          <a href="/registro" className="font-medium text-brand hover:underline">
            Registrá tu negocio
          </a>{" "}
          o{" "}
          <a href="#contacto" className="font-medium text-brand hover:underline">
            escribinos
          </a>{" "}
          y armamos una propuesta con lo que realmente necesitás.
        </p>

        <p className="reveal mt-3 text-center text-sm text-muted">
          Esto es lo que se instala en cada nivel. Para ver cuántas placas
          incluye cada plan y el precio mensual,{" "}
          <Link href="/precios" className="font-medium text-brand hover:underline">
            mirá los planes
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
