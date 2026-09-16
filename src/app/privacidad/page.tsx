import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué información recopila TapGoCR, para qué la utiliza y cómo la protege.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-sm text-muted">
            Última actualización: 10 de septiembre de 2026
          </p>

          <div className="mt-10 flex flex-col gap-10 text-muted">
            <p>
              En {appName} nos tomamos en serio la privacidad de nuestros
              clientes, usuarios y visitantes. Esta Política de Privacidad
              explica qué información podemos recopilar, para qué la
              utilizamos y cómo la protegemos cuando utilizás nuestro sitio
              web, plataforma, páginas de negocios y servicios.
            </p>
            <p>
              {appName} es un servicio orientado a negocios en Costa Rica que
              permite crear y administrar páginas digitales accesibles
              mediante códigos QR y tecnología NFC, así como gestionar
              enlaces, contenido, estadísticas, dominios, sitios web y
              servicios relacionados.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                1. Información que recopilamos
              </h2>
              <p className="mt-4">
                Dependiendo de cómo utilicés {appName}, podemos recopilar:
              </p>

              <h3 className="mt-6 font-semibold text-foreground">
                Información de cuenta
              </h3>
              <p className="mt-2">
                Cuando creás una cuenta podemos solicitar:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Nombre.</li>
                <li>Correo electrónico.</li>
                <li>Contraseña o credenciales necesarias para acceder a la cuenta.</li>
                <li>Nombre del negocio.</li>
                <li>Número de teléfono, cuando corresponda.</li>
                <li>Información necesaria para configurar y administrar el servicio.</li>
              </ul>

              <h3 className="mt-6 font-semibold text-foreground">
                Información del negocio
              </h3>
              <p className="mt-2">
                Los clientes pueden proporcionar información para mostrar en
                su página de {appName}, incluyendo:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Nombre comercial.</li>
                <li>Logotipo e imágenes.</li>
                <li>Descripción del negocio.</li>
                <li>Menús y productos.</li>
                <li>Precios.</li>
                <li>Horarios.</li>
                <li>Dirección o ubicación.</li>
                <li>Número de teléfono.</li>
                <li>WhatsApp.</li>
                <li>Redes sociales.</li>
                <li>Sitio web.</li>
                <li>Enlaces externos.</li>
                <li>Información promocional.</li>
                <li>Cualquier otro contenido que el cliente decida publicar.</li>
              </ul>
              <p className="mt-3">
                El cliente es responsable de asegurarse de que cuenta con los
                derechos necesarios para publicar dicha información.
              </p>

              <h3 className="mt-6 font-semibold text-foreground">
                Información de uso y estadísticas
              </h3>
              <p className="mt-2">
                Dependiendo del plan contratado, {appName} puede recopilar
                información relacionada con la utilización de las placas,
                códigos QR y páginas, como:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Cantidad de escaneos.</li>
                <li>Fecha y hora de las interacciones.</li>
                <li>Identificador de la placa o punto de acceso.</li>
                <li>Página o contenido visitado.</li>
                <li>Botones o enlaces seleccionados.</li>
                <li>Información técnica necesaria para operar y proteger el servicio.</li>
              </ul>
              <p className="mt-3">
                Las estadísticas se utilizan principalmente para proporcionar
                funcionalidades de analytics al negocio y mejorar el
                funcionamiento de {appName}.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                2. Cómo utilizamos la información
              </h2>
              <p className="mt-4">Podemos utilizar la información recopilada para:</p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Crear y administrar cuentas.</li>
                <li>Proporcionar los servicios contratados.</li>
                <li>Mostrar las páginas digitales de los negocios.</li>
                <li>Procesar y registrar interacciones con códigos QR y NFC.</li>
                <li>Proporcionar estadísticas y analytics.</li>
                <li>Configurar dominios y servicios relacionados.</li>
                <li>Proporcionar soporte técnico.</li>
                <li>Mantener, proteger y mejorar la plataforma.</li>
                <li>Detectar actividades fraudulentas, abusivas o no autorizadas.</li>
                <li>Comunicarnos con nuestros clientes respecto de sus cuentas o servicios.</li>
                <li>Cumplir obligaciones legales aplicables.</li>
              </ul>
              <p className="mt-3">
                No utilizamos el contenido de un negocio para fines distintos
                de los necesarios para proporcionar, mantener y mejorar los
                servicios de {appName}, salvo cuando exista autorización del
                cliente o una obligación legal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                3. Información de los visitantes de las páginas
              </h2>
              <p className="mt-4">
                Las personas que escanean un código QR o acercan un teléfono a
                una placa NFC pueden acceder a una página pública sin crear
                una cuenta en {appName}.
              </p>
              <p className="mt-3">
                Dependiendo de la configuración y funcionalidades disponibles,
                podemos procesar información técnica y estadística
                relacionada con esas visitas con el objetivo de medir el uso
                del servicio, generar estadísticas para el negocio y mantener
                la seguridad de la plataforma.
              </p>
              <p className="mt-3">
                {appName} no requiere que el visitante cree una cuenta para
                consultar una página pública.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                4. Cookies y tecnologías similares
              </h2>
              <p className="mt-4">
                {appName} puede utilizar cookies, almacenamiento local u otras
                tecnologías similares necesarias para:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Mantener sesiones iniciadas.</li>
                <li>Recordar determinadas preferencias.</li>
                <li>Proteger cuentas.</li>
                <li>Mantener la seguridad.</li>
                <li>Analizar el funcionamiento de la plataforma.</li>
                <li>Obtener estadísticas de uso cuando corresponda.</li>
              </ul>
              <p className="mt-3">
                Las tecnologías utilizadas pueden variar según las
                funcionalidades activas de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                5. Enlaces a terceros
              </h2>
              <p className="mt-4">
                Las páginas creadas mediante {appName} pueden contener
                enlaces hacia servicios externos, incluyendo WhatsApp,
                Instagram, TikTok, Facebook, Google Maps, Google Reviews,
                sitios web de terceros y otros servicios.
              </p>
              <p className="mt-3">
                Al seleccionar uno de estos enlaces, el usuario abandona o
                interactúa con un servicio que puede tener sus propias
                políticas de privacidad y términos.
              </p>
              <p className="mt-3">
                {appName} no controla las prácticas de privacidad de terceros
                y recomienda revisar sus respectivas políticas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                6. Proveedores de servicios
              </h2>
              <p className="mt-4">
                Podemos utilizar proveedores externos para operar
                determinados componentes de {appName}, tales como:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Infraestructura y alojamiento.</li>
                <li>Servicios de correo electrónico.</li>
                <li>Registro y administración de dominios.</li>
                <li>Procesamiento de pagos, cuando corresponda.</li>
                <li>Servicios de seguridad.</li>
                <li>Herramientas de analítica.</li>
                <li>Servicios técnicos necesarios para operar la plataforma.</li>
              </ul>
              <p className="mt-3">
                Estos proveedores podrán procesar información únicamente en
                la medida necesaria para proporcionar los servicios
                correspondientes.
              </p>
              <p className="mt-3 font-medium text-foreground">
                {appName} no vende los datos personales de sus clientes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                7. Protección de la información
              </h2>
              <p className="mt-4">
                Implementamos medidas técnicas y organizativas razonables
                destinadas a proteger la información contra acceso no
                autorizado, pérdida, alteración, divulgación o destrucción.
              </p>
              <p className="mt-3">
                Sin embargo, ningún sistema conectado a Internet puede
                garantizar una seguridad absoluta. Los clientes también son
                responsables de proteger sus credenciales y de utilizar
                contraseñas adecuadamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                8. Conservación de la información
              </h2>
              <p className="mt-4">
                Conservamos la información durante el tiempo necesario para
                proporcionar los servicios, mantener registros legítimos de
                la relación con el cliente, cumplir obligaciones legales y
                resolver posibles disputas.
              </p>
              <p className="mt-3">
                Cuando una cuenta es cancelada, determinada información podrá
                conservarse durante el período razonablemente necesario para
                estos fines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                9. Derechos de los usuarios
              </h2>
              <p className="mt-4">
                Las personas pueden solicitar, según corresponda y conforme a
                la legislación aplicable:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Acceso a sus datos personales.</li>
                <li>Corrección de información incorrecta.</li>
                <li>Actualización de información.</li>
                <li>Eliminación de información cuando legalmente proceda.</li>
                <li>Información sobre el tratamiento de sus datos.</li>
              </ul>
              <p className="mt-3">
                Las solicitudes pueden realizarse mediante los canales de
                contacto de {appName}.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                10. Datos proporcionados por los clientes
              </h2>
              <p className="mt-4">
                Cuando un negocio utiliza {appName} para publicar información
                sobre sus clientes, empleados, proveedores u otras personas,
                el negocio es responsable de contar con las autorizaciones o
                bases legales necesarias para proporcionar y publicar dicha
                información.
              </p>
              <p className="mt-3">
                {appName} actúa como proveedor tecnológico respecto del
                contenido que el cliente decide administrar y publicar
                mediante la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                11. Cambios a esta política
              </h2>
              <p className="mt-4">
                Podemos actualizar esta Política de Privacidad cuando sea
                necesario para reflejar cambios en nuestros servicios,
                tecnología o requisitos legales.
              </p>
              <p className="mt-3">
                Cuando corresponda, publicaremos la versión actualizada en
                este sitio indicando la fecha de última actualización.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                12. Contacto
              </h2>
              <p className="mt-4">
                Si tenés preguntas sobre esta Política de Privacidad, el
                tratamiento de datos o tu cuenta de {appName}, podés
                contactarnos mediante los canales disponibles en{" "}
                <Link href="/#contacto" className="text-brand hover:underline">
                  nuestro sitio web
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
