/**
 * Correo entrante → #solicitudes.
 *
 *   npm run email:check
 *
 * Pensado para correr cada pocos minutos desde un timer del sistema, igual
 * que `notify-domains.ts`. Revisa los tres buzones (info@/support@/sales@),
 * y por cada correo no leído:
 *
 *   1. lo marca como leído (deduplicación natural: no se reprocesa solo)
 *   2. busca al remitente entre los `User` existentes
 *   3. manda un aviso a Discord #solicitudes con lo que encontró
 *
 * NO crea un canal #correos aparte — todo entra a #solicitudes, como pidió
 * la especificación. Un buzón caído no frena a los otros dos: cada uno se
 * intenta y se reporta por separado.
 *
 * Usa su propio PrismaClient (no el de `src/lib/prisma.ts`), mismo criterio
 * que el resto de los scripts standalone de este proyecto.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client.ts";
import { notifyInboundEmail } from "../src/lib/discord/events.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";
import { fetchUnseenEmails, type MailboxCredentials } from "../src/lib/email/inbound.ts";
import { tapgoOrigin } from "../src/lib/config.ts";

const ADMIN_ORIGIN = tapgoOrigin.replace(/^https?:\/\//, "https://app.");

// El servidor real de correo (verificado por SSH/SMTP): "tapgocr.com" está
// detrás de Cloudflare para el sitio web y no acepta IMAP/SMTP directo.
const IMAP_HOST = process.env.IMAP_HOST ?? "shared11.racknation.cr";
const IMAP_PORT = Number(process.env.IMAP_PORT ?? 993);

// Página general de webmail del hosting: no hay deep-link confiable a un
// mensaje individual en Roundcube sin sesión ya iniciada, así que "Abrir
// correo" lleva acá en vez de inventar una URL que no existe.
const WEBMAIL_URL = `https://${IMAP_HOST}:2096/`;

type Department = "info" | "support" | "sales";

const MAILBOXES: Array<{ department: Department; user: string; password: string | undefined }> = [
  { department: "info", user: "info@tapgocr.com", password: process.env.IMAP_INFO_PASSWORD },
  { department: "support", user: "support@tapgocr.com", password: process.env.IMAP_SUPPORT_PASSWORD },
  { department: "sales", user: "sales@tapgocr.com", password: process.env.IMAP_SALES_PASSWORD },
];

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseConnectionString(process.env.DATABASE_URL!)),
});

async function main() {
  let totalProcessed = 0;
  let totalFailedMailboxes = 0;

  for (const mailbox of MAILBOXES) {
    if (!mailbox.password) {
      console.log(`  ! Sin contraseña configurada para ${mailbox.user}, se omite.`);
      continue;
    }

    const credentials: MailboxCredentials = {
      host: IMAP_HOST,
      port: IMAP_PORT,
      user: mailbox.user,
      password: mailbox.password,
    };

    const { emails, error } = await fetchUnseenEmails(credentials);

    if (error) {
      console.error(`  ✗ ${mailbox.user}: ${error}`);
      totalFailedMailboxes++;
      continue;
    }

    console.log(`  ${mailbox.user}: ${emails.length} correo(s) nuevo(s).`);

    for (const email of emails) {
      const client = await prisma.user.findUnique({
        where: { email: email.from },
        select: { id: true, name: true },
      });

      await notifyInboundEmail({
        eventId: `inbound-email:${mailbox.department}:${email.uid}:${email.messageId ?? email.receivedAt.getTime()}`,
        department: `${mailbox.department}@tapgocr.com` as
          | "info@tapgocr.com"
          | "support@tapgocr.com"
          | "sales@tapgocr.com",
        from: email.from,
        fromName: email.fromName,
        subject: email.subject,
        preview: email.preview,
        clientName: client?.name ?? null,
        clientUrl: client ? `${ADMIN_ORIGIN}/app/clients/${client.id}` : null,
        mailboxUrl: WEBMAIL_URL,
      });

      totalProcessed++;
    }
  }

  console.log(`Listo: ${totalProcessed} correo(s) procesado(s), ${totalFailedMailboxes} buzón(es) con error.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
