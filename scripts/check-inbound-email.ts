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
import { acquireCronLock, releaseCronLock } from "./cron-lock.ts";
import { notifyInboundEmail } from "../src/lib/discord/events.ts";
import { parseConnectionString } from "../src/lib/database-url.ts";
import { fetchUnseenEmails, type MailboxCredentials } from "../src/lib/email/inbound.ts";
import { appOrigin } from "../src/lib/config.ts";

/** Corre cada 5 minutos; una corrida se considera colgada a partir de este umbral. */
const LOCK_MAX_AGE_MS = 4 * 60_000;

/**
 * `ImapFlow` no expone ningún timeout configurable (ver auditoría de sus
 * tipos): si el servidor de correo deja de responder a mitad de una
 * operación, la promesa de `fetchUnseenEmails` nunca se resuelve. Sin este
 * límite, un solo buzón caído cuelga el script para siempre — que ya sumado
 * al cron cada 5 minutos fue justo lo que agotó los procesos de la cuenta el
 * 2026-09-16.
 */
const MAILBOX_TIMEOUT_MS = 20_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiempo de espera agotado (${label})`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

const ADMIN_ORIGIN = appOrigin;

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
  if (!acquireCronLock("check-inbound-email", LOCK_MAX_AGE_MS)) {
    console.log("Ya hay una corrida de check-inbound-email en curso, se omite esta.");
    return;
  }

  let totalProcessed = 0;
  let totalFailedMailboxes = 0;

  try {
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

      const { emails, error } = await withTimeout(
        fetchUnseenEmails(credentials),
        MAILBOX_TIMEOUT_MS,
        mailbox.user,
      ).catch((timeoutError: Error) => ({ emails: [], error: timeoutError.message }));

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
  } finally {
    releaseCronLock("check-inbound-email");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    // Un socket IMAP que un timeout dejó a medio cerrar puede mantener el
    // proceso vivo aunque toda la lógica ya haya terminado; forzar la salida
    // es lo que de verdad garantiza que el cron no vuelva a apilar corridas.
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
