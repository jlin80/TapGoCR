import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

/**
 * Lectura de correo entrante por IMAP.
 *
 * Sin acceso a Prisma a propósito — mismo criterio que `domain-notices.ts`:
 * esto solo sabe hablarle al buzón, no a la base. La identificación de
 * cliente y la clasificación viven en `scripts/check-inbound-email.ts`.
 *
 * Solo lee mensajes NO LEÍDOS y los marca como leídos al terminar de
 * procesarlos: es la deduplicación natural — un correo ya leído no se vuelve
 * a mandar a Discord aunque el script corra de nuevo.
 */

export type InboundEmail = {
  /** Message-ID real del correo (RFC 5322), para el enlace "Abrir correo" cuando el proveedor lo permite. */
  messageId: string | null;
  uid: number;
  from: string;
  /** Nombre para mostrar del remitente, cuando el correo lo trae (ej. "Ana Pérez"). */
  fromName: string | null;
  subject: string;
  /** Primeros ~280 caracteres del cuerpo en texto plano, ya sin HTML. */
  preview: string;
  receivedAt: Date;
};

export type MailboxCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
};

const PREVIEW_MAX_LENGTH = 280;

/** Recorta y limpia el cuerpo del mensaje para la vista previa — nunca se manda el correo completo. */
function buildPreview(text: string | undefined, html: string | undefined | false): string {
  const raw = (text ?? stripHtml(typeof html === "string" ? html : "")).replace(/\s+/g, " ").trim();
  return raw.length > PREVIEW_MAX_LENGTH ? `${raw.slice(0, PREVIEW_MAX_LENGTH - 1)}…` : raw;
}

/** Solo para armar la vista previa cuando el correo no trae versión en texto plano. Nunca se reenvía este HTML. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

/**
 * Conecta a un buzón, trae los mensajes no leídos, y los marca como leídos.
 * Nunca lanza: un buzón caído no debe frenar a los otros dos ni a TapGoCR.
 */
export async function fetchUnseenEmails(
  credentials: MailboxCredentials,
): Promise<{ emails: InboundEmail[]; error: string | null }> {
  const client = new ImapFlow({
    host: credentials.host,
    port: credentials.port,
    secure: true,
    auth: { user: credentials.user, pass: credentials.password },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const emails: InboundEmail[] = [];

    try {
      for await (const message of client.fetch(
        { seen: false },
        { envelope: true, source: true, uid: true },
      )) {
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);

        emails.push({
          messageId: parsed.messageId ?? null,
          uid: message.uid,
          from: parsed.from?.value[0]?.address ?? message.envelope?.from?.[0]?.address ?? "desconocido",
          fromName: parsed.from?.value[0]?.name || null,
          subject: parsed.subject ?? "(sin asunto)",
          preview: buildPreview(parsed.text, parsed.html),
          receivedAt: parsed.date ?? new Date(),
        });
      }

      // Se marcan como leídos recién después de parsear todos: si algo
      // falla a mitad, el próximo intento los vuelve a ver en vez de
      // perderlos.
      if (emails.length > 0) {
        await client.messageFlagsAdd(
          { uid: emails.map((e) => e.uid).join(",") },
          ["\\Seen"],
          { uid: true },
        );
      }
    } finally {
      lock.release();
    }

    return { emails, error: null };
  } catch (error) {
    return { emails: [], error: error instanceof Error ? error.message : String(error) };
  } finally {
    await client.logout().catch(() => {});
  }
}
