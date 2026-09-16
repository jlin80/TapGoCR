import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Por qué existe TapGoCR y qué problema resuelve para negocios en Costa Rica.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/nosotros" },
};

export default function NosotrosPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              Nosotros
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-5xl">
              Tecnología simple para negocios reales
            </h1>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <div className="flex flex-col gap-10 text-muted">
            <div>
              <p>
                {appName} nació con una idea sencilla: un negocio no debería
                necesitar cambiar un QR, reimprimir un menú o llamar a un
                técnico cada vez que quiere actualizar su información.
              </p>
              <p className="mt-4">
                Por eso creamos una plataforma que conecta el mundo físico con
                el digital mediante NFC y códigos QR. Una placa en una mesa,
                una barra, una recepción o una vitrina puede convertirse en
                el punto de entrada a todo lo que un negocio quiere mostrar:
                su menú, WhatsApp, redes sociales, ubicación, reseñas, sitio
                web y mucho más.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Una placa. Todo el negocio.
              </h2>
              <p className="mt-4">
                En lugar de llenar un local de códigos diferentes, {appName}{" "}
                permite centralizar la información en una sola experiencia.
                El cliente acerca su teléfono o escanea un QR y llega
                directamente a la página del negocio. No necesita descargar
                una aplicación.
              </p>
              <p className="mt-4">
                Y cuando el negocio cambia su información, el código físico no
                tiene que cambiar.{" "}
                <strong className="font-medium text-foreground">
                  El código permanece. El contenido evoluciona.
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Hecho para negocios de Costa Rica
              </h2>
              <p className="mt-4">
                Diseñamos {appName} pensando especialmente en pequeños y
                medianos negocios que necesitan una presencia digital
                profesional, pero que no necesariamente cuentan con un equipo
                técnico.
              </p>
              <p className="mt-4">
                Restaurantes, cafeterías, bares, sodas, barberías, hoteles,
                tiendas, gimnasios, emprendimientos y muchos otros negocios
                pueden utilizar la misma tecnología de diferentes maneras.
              </p>
              <p className="mt-4">
                Nuestro objetivo no es complicar la tecnología. Es hacerla
                útil.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Más que NFC
              </h2>
              <p className="mt-4">
                {appName} comenzó alrededor de una idea física: una placa que
                conecta un cliente con un negocio. Pero la plataforma va más
                allá del NFC. También ofrecemos:
              </p>
              <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-5">
                <li>Códigos QR dinámicos.</li>
                <li>Páginas digitales para negocios.</li>
                <li>Menús digitales.</li>
                <li>Enlaces a WhatsApp y redes sociales.</li>
                <li>Estadísticas de uso.</li>
                <li>Gestión de múltiples puntos.</li>
                <li>Dominios propios.</li>
                <li>Desarrollo de sitios web.</li>
                <li>Hosting y mantenimiento.</li>
              </ul>
              <p className="mt-4">
                Así, una placa puede ser el primer paso hacia una presencia
                digital mucho más completa.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                El negocio mantiene el control
              </h2>
              <p className="mt-4">
                Una de las cosas más importantes para nosotros es que el
                negocio sea dueño de su información. Si cambia un precio,
                cambia el menú. Si cambia el número de WhatsApp, cambia el
                enlace. Si quiere agregar Instagram, TikTok, su sitio web o
                una nueva promoción, puede hacerlo.
              </p>
              <p className="mt-4">
                La tecnología debe adaptarse al negocio, no al contrario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Nuestra visión
              </h2>
              <p className="mt-4">
                Queremos que tener una presencia digital profesional sea
                accesible para cualquier negocio, independientemente de su
                tamaño.
              </p>
              <p className="mt-4">
                No creemos que digitalizar un negocio tenga que significar
                contratar sistemas complejos, aprender herramientas
                difíciles o depender de terceros para cada pequeño cambio.
                Queremos construir una herramienta que haga ese proceso más
                sencillo.
              </p>
              <p className="mt-4 font-medium text-foreground">
                Menos complicaciones. Más control.
              </p>
            </section>
          </div>
        </article>

        <section className="on-dark">
          <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-20">
            <p className="text-lg text-pretty">
              Si tenés un negocio y querés mejorar la forma en que tus
              clientes encuentran tu información, podemos ayudarte a
              construir una solución adaptada a lo que realmente necesitás.
            </p>
            <p className="mt-3 font-medium">
              Un toque puede ser suficiente para empezar.
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- nginx redirige /registro a app.{dominio}; <Link> falla por CORS al precargar cross-origin */}
            <a
              href="/registro"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3.5 font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
            >
              Registrá tu negocio
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
