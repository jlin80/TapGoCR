import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";

import { appName, tapgoOrigin } from "@/lib/config";

import "./globals.css";

/**
 * Tipografia de la marca.
 *
 * Se cargan con `next/font`, que las descarga en tiempo de compilacion y las
 * sirve desde el propio dominio. No es una preferencia: la CSP del proyecto
 * declara `font-src 'self' data:`, asi que una hoja de estilos de Google Fonts
 * quedaria bloqueada y la pagina caeria en las fuentes del sistema sin avisar.
 *
 * Servirlas desde el propio origen ademas evita una conexion a un tercero en la
 * ruta critica, que es justo lo que mas pesa en una landing abierta desde datos
 * moviles.
 *
 * El subconjunto `latin` cubre el espanol completo, tildes y enie incluidas.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--face-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--face-body",
  display: "swap",
});

export const metadata: Metadata = {
  // Resuelve las URLs relativas de OG/canonical de cada página contra el
  // dominio público real, en vez de contra el origen desde el que Next
  // construye (que en un despliegue detrás de proxy no es el mismo).
  metadataBase: new URL(tapgoOrigin),
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "Soluciones NFC y QR con landing dinámica y analytics para negocios, por " +
    `${appName}.`,
  applicationName: appName,
};

/**
 * Identifica la marca ante los buscadores (independiente de cada página).
 * Solo datos ya conocidos y verificables del propio código — nada de
 * teléfono, dirección física ni redes sociales que no existan todavía.
 */
function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: appName,
    url: tapgoOrigin,
    logo: `${tapgoOrigin}/icon.png`,
    areaServed: "CR",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${display.variable} ${body.variable}`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        {children}
      </body>
    </html>
  );
}
