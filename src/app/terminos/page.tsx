import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { appName } from "@/lib/config";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de acceso y uso de TapGoCR y de los servicios proporcionados.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-sm text-muted">
            Última actualización: 10 de septiembre de 2026
          </p>

          <div className="mt-10 flex flex-col gap-10 text-muted">
            <p>
              Estos Términos y Condiciones regulan el acceso y uso de{" "}
              {appName} y de los servicios proporcionados por {appName}.
            </p>
            <p>
              Al crear una cuenta, contratar un servicio o utilizar la
              plataforma, aceptás estos términos. Si no estás de acuerdo con
              ellos, no debés utilizar los servicios de {appName}.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                1. Sobre {appName}
              </h2>
              <p className="mt-4">
                {appName} proporciona herramientas para que los negocios
                puedan crear y administrar páginas digitales accesibles
                mediante códigos QR y tecnología NFC.
              </p>
              <p className="mt-3">
                Los servicios pueden incluir, dependiendo del plan
                contratado:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Placas NFC y QR.</li>
                <li>Páginas digitales para negocios.</li>
                <li>Gestión de enlaces.</li>
                <li>Menús digitales.</li>
                <li>Estadísticas y analytics.</li>
                <li>Administración de múltiples puntos o placas.</li>
                <li>Códigos QR descargables.</li>
                <li>Configuración y administración de dominios.</li>
                <li>Desarrollo de sitios web.</li>
                <li>Hosting.</li>
                <li>Mantenimiento y actualizaciones.</li>
              </ul>
              <p className="mt-3">
                Las características disponibles pueden variar según el plan
                contratado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                2. Registro de cuenta
              </h2>
              <p className="mt-4">
                Para utilizar determinadas funcionalidades es necesario crear
                una cuenta. El usuario acepta proporcionar información
                correcta y mantenerla actualizada.
              </p>
              <p className="mt-3">El titular de la cuenta es responsable de:</p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Mantener la confidencialidad de sus credenciales.</li>
                <li>Evitar compartir su acceso con personas no autorizadas.</li>
                <li>Informar a {appName} si detecta un acceso no autorizado.</li>
                <li>
                  Todas las actividades realizadas desde su cuenta, salvo
                  cuando exista evidencia de acceso no autorizado ajeno a su
                  control.
                </li>
              </ul>
              <p className="mt-3">
                {appName} puede suspender temporalmente una cuenta cuando
                existan razones razonables para considerar que se está
                utilizando de forma fraudulenta, abusiva o contraria a estos
                términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                3. Contenido del negocio
              </h2>
              <p className="mt-4">
                El cliente conserva la responsabilidad sobre el contenido que
                publica mediante {appName}. Esto incluye:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Textos.</li>
                <li>Fotografías.</li>
                <li>Logotipos.</li>
                <li>Menús.</li>
                <li>Precios.</li>
                <li>Información de contacto.</li>
                <li>Enlaces.</li>
                <li>Material promocional.</li>
                <li>Información sobre productos o servicios.</li>
              </ul>
              <p className="mt-3">
                El cliente declara que tiene los derechos, permisos o
                autorizaciones necesarias para utilizar dicho contenido.
              </p>
              <p className="mt-3">
                El cliente no debe utilizar {appName} para publicar
                contenido:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Ilegal.</li>
                <li>Fraudulento.</li>
                <li>Engañoso.</li>
                <li>Difamatorio.</li>
                <li>Que infrinja derechos de terceros.</li>
                <li>Que infrinja derechos de propiedad intelectual.</li>
                <li>Que promueva actividades ilegales.</li>
                <li>Que contenga malware o código malicioso.</li>
                <li>
                  Que intente comprometer la seguridad de {appName} o de
                  terceros.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                4. Responsabilidad sobre la información publicada
              </h2>
              <p className="mt-4">
                {appName} proporciona la infraestructura tecnológica para
                mostrar el contenido. El negocio es responsable de verificar
                que la información publicada sea correcta y esté
                actualizada.
              </p>
              <p className="mt-3">
                Por ejemplo, si un negocio cambia un precio, horario, número
                de teléfono, dirección o enlace, corresponde al cliente
                actualizar dicha información desde su cuenta o solicitar el
                cambio cuando el servicio contratado contemple administración
                por parte de {appName}.
              </p>
              <p className="mt-3">
                {appName} no garantiza la exactitud del contenido
                proporcionado por los clientes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                5. Códigos QR y NFC
              </h2>
              <p className="mt-4">
                Las placas y chips NFC proporcionados por{" "}
                {appName} funcionan como mecanismos para dirigir a los
                usuarios hacia una URL o página determinada.
              </p>
              <p className="mt-3">
                El contenido asociado puede modificarse sin necesidad de
                reemplazar el código físico, siempre que la infraestructura
                de {appName} continúe activa.
              </p>
              <p className="mt-3">
                {appName} no garantiza que todos los dispositivos móviles
                sean compatibles con todas las funcionalidades NFC
                disponibles. El QR funciona como mecanismo alternativo cuando
                el dispositivo no dispone de NFC compatible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                6. Analytics
              </h2>
              <p className="mt-4">
                Los planes que incluyen analytics pueden proporcionar
                estadísticas relacionadas con el uso de las placas y páginas.
                Estas estadísticas pueden incluir escaneos, clics, fechas,
                puntos de acceso y otras métricas disponibles dentro de la
                plataforma.
              </p>
              <p className="mt-3">
                Las estadísticas tienen carácter informativo y pueden
                presentar limitaciones derivadas de navegadores, dispositivos,
                bloqueadores, configuraciones de privacidad, redes u otros
                factores técnicos.
              </p>
              <p className="mt-3">
                {appName} no garantiza que cada interacción sea registrada de
                forma absoluta o idéntica a las métricas proporcionadas por
                plataformas externas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                7. Servicios de terceros
              </h2>
              <p className="mt-4">
                {appName} puede permitir enlaces hacia servicios externos
                como WhatsApp, Instagram, TikTok, Facebook, Google Maps,
                Google Reviews y otros.
              </p>
              <p className="mt-3">
                {appName} no controla dichos servicios ni garantiza su
                disponibilidad, funcionamiento, contenido, políticas o
                condiciones.
              </p>
              <p className="mt-3">
                El uso de servicios externos está sujeto a los términos y
                políticas de sus respectivos proveedores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                8. Dominios
              </h2>
              <p className="mt-4">
                Cuando el cliente contrata un servicio relacionado con
                dominios, {appName} puede ayudar con el registro,
                configuración DNS y administración técnica.
              </p>
              <p className="mt-3">
                La disponibilidad de un dominio depende del registrador
                correspondiente y de las reglas aplicables al nombre de
                dominio. {appName} no garantiza que un nombre de dominio
                específico esté disponible hasta completar el proceso de
                registro.
              </p>
              <p className="mt-3">
                Los dominios están sujetos a las políticas y condiciones del
                registrador y del registro correspondiente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                9. Sitios web y hosting
              </h2>
              <p className="mt-4">
                Cuando el cliente contrata desarrollo web, hosting o
                mantenimiento, las condiciones específicas pueden depender
                del alcance acordado para el proyecto.
              </p>
              <p className="mt-3">
                Los cambios, funcionalidades adicionales o trabajos que
                excedan el alcance originalmente contratado pueden requerir
                una cotización adicional.
              </p>
              <p className="mt-3">
                {appName} puede suspender servicios de hosting cuando existan
                facturas pendientes, uso abusivo, actividad ilegal o
                incumplimiento de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                10. Pagos y suscripciones
              </h2>
              <p className="mt-4">
                Los precios, períodos de facturación, características y
                condiciones económicas serán los indicados en el plan o
                propuesta contratada.
              </p>
              <p className="mt-3">
                Cuando exista una suscripción, el cliente acepta pagar las
                cantidades correspondientes según el período contratado. El
                impago puede provocar la suspensión del servicio.
              </p>
              <p className="mt-3">
                Cuando corresponda, {appName} podrá ofrecer un período
                razonable para regularizar el pago antes de desactivar
                determinados servicios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                11. Cancelación
              </h2>
              <p className="mt-4">
                El cliente puede solicitar la cancelación de su servicio. Al
                cancelar, las placas NFC y códigos QR asociados pueden dejar
                de dirigir a la página activa del negocio.
              </p>
              <p className="mt-3">
                Los datos e historial de la cuenta podrán conservarse durante
                el período establecido en la Política de Privacidad y
                conforme a las obligaciones legales aplicables.
              </p>
              <p className="mt-3">
                Los servicios de terceros, como dominios registrados, pueden
                tener condiciones de cancelación y renovación independientes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                12. Disponibilidad del servicio
              </h2>
              <p className="mt-4">
                {appName} procura mantener la plataforma disponible y
                funcionando correctamente, pero no garantiza disponibilidad
                ininterrumpida. El servicio puede verse temporalmente
                afectado por:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Mantenimiento.</li>
                <li>Actualizaciones.</li>
                <li>Fallos de infraestructura.</li>
                <li>Problemas de conectividad.</li>
                <li>Fallos de proveedores externos.</li>
                <li>Ataques informáticos.</li>
                <li>Circunstancias fuera del control razonable de {appName}.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                13. Limitación de responsabilidad
              </h2>
              <p className="mt-4">
                {appName} no será responsable por pérdidas derivadas
                exclusivamente de:
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Información incorrecta proporcionada por el cliente.</li>
                <li>Enlaces externos que dejen de funcionar.</li>
                <li>Fallos de servicios de terceros.</li>
                <li>Interrupciones de Internet.</li>
                <li>Incompatibilidad de dispositivos.</li>
                <li>Uso incorrecto de las herramientas.</li>
                <li>Pérdida de credenciales ocasionada por negligencia del cliente.</li>
                <li>Contenido publicado por el cliente.</li>
              </ul>
              <p className="mt-3">
                Nada en estos términos pretende excluir responsabilidades que
                legalmente no puedan ser excluidas o limitadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                14. Propiedad intelectual
              </h2>
              <p className="mt-4">
                La plataforma, software, diseño, código, marca, logotipos,
                interfaces y demás elementos propios de {appName} pertenecen
                a {appName} o a sus respectivos licenciantes.
              </p>
              <p className="mt-3">
                El cliente conserva los derechos sobre el contenido que
                proporciona, sujeto a los derechos necesarios para que{" "}
                {appName} pueda alojarlo, procesarlo y mostrarlo como parte
                del servicio.
              </p>
              <p className="mt-3">
                El uso de {appName} no transfiere al cliente la propiedad del
                software o infraestructura de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                15. Uso prohibido
              </h2>
              <p className="mt-4">Está prohibido utilizar {appName} para:</p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                <li>Atacar o intentar comprometer la plataforma.</li>
                <li>Obtener acceso no autorizado a cuentas.</li>
                <li>Distribuir malware.</li>
                <li>Realizar actividades fraudulentas.</li>
                <li>Infringir derechos de terceros.</li>
                <li>Interferir deliberadamente con el funcionamiento del servicio.</li>
                <li>Intentar obtener datos de otros clientes.</li>
                <li>Utilizar la plataforma para actividades ilegales.</li>
              </ul>
              <p className="mt-3">
                {appName} podrá tomar medidas razonables para proteger la
                plataforma y a sus usuarios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                16. Modificaciones de los servicios
              </h2>
              <p className="mt-4">
                {appName} puede modificar, agregar o retirar funcionalidades
                de la plataforma cuando sea necesario.
              </p>
              <p className="mt-3">
                Cuando un cambio afecte materialmente a un servicio
                contratado, {appName} procurará comunicarlo de manera
                razonable cuando corresponda.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                17. Modificación de estos términos
              </h2>
              <p className="mt-4">
                Podemos actualizar estos Términos y Condiciones para
                reflejar cambios en nuestros servicios, operaciones o
                requisitos legales.
              </p>
              <p className="mt-3">
                La versión vigente estará disponible en el sitio web de{" "}
                {appName}.
              </p>
              <p className="mt-3">
                El uso continuado del servicio después de la entrada en
                vigor de una modificación constituye aceptación de los
                términos actualizados, en la medida permitida por la
                legislación aplicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                18. Legislación aplicable
              </h2>
              <p className="mt-4">
                Estos términos se interpretarán conforme a la legislación
                aplicable en Costa Rica, sin perjuicio de los derechos que
                correspondan al consumidor o usuario conforme a la
                legislación vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground">
                19. Contacto
              </h2>
              <p className="mt-4">
                Para consultas relacionadas con estos términos, tu cuenta o
                los servicios contratados, podés utilizar los{" "}
                <Link href="/#contacto" className="text-brand hover:underline">
                  canales de contacto disponibles
                </Link>{" "}
                en {appName}.
              </p>
            </section>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
