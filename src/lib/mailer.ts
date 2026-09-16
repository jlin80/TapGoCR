import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envio de correo del sistema.
 *
 * Se usa SMTP autenticado contra un proveedor real (Zoho, Google Workspace,
 * Resend, Postmark...), NO un servidor de correo propio. El motivo es la
 * entregabilidad: un correo enviado directamente desde la IP de un VPS nuevo
 * cae en spam durante meses, y montar reputacion exige SPF, DKIM, DMARC,
 * bucles de retroalimentacion y vigilancia de listas negras. Con relay
 * autenticado, la reputacion la pone el proveedor.
 *
 * Que el proveedor sea intercambiable por variables de entorno es deliberado:
 * ninguno queda incrustado en el codigo.
 *
 * Sin SMTP configurado el modulo NO falla: informa que no esta configurado y
 * quien llama decide. Una instalacion sin correo debe seguir funcionando, que
 * es exactamente como opera hoy el registro de clientes.
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type MailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: string };

function config() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !user || !pass || !from) return null;

  // 465 es TLS implicito; 587 usa STARTTLS. Es el reparto habitual y evita
  // tener que exponer otra variable.
  const port = Number(process.env.SMTP_PORT ?? 587);

  return { host, port, secure: port === 465, user, pass, from };
}

/** ¿Hay SMTP configurado? Lo consultan la consola y la tarea de avisos. */
export function mailerConfigured(): boolean {
  return config() !== null;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const settings = config();
  if (!settings) return null;

  transporter ??= nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.pass },
  });

  return transporter;
}

/**
 * Envia un correo. Nunca lanza: devuelve el motivo del fallo.
 *
 * Igual que el tracking de analytics, un fallo de correo no puede tumbar la
 * operacion que lo disparo. Un aviso de vencimiento que no sale debe quedar
 * registrado, no interrumpir la tarea para los demas dominios.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const settings = config();
  const transport = getTransporter();

  if (!settings || !transport) {
    return { sent: false, reason: "SMTP no configurado" };
  }

  try {
    const info = await transport.sendMail({
      from: settings.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Comprueba la conexion sin enviar nada. Util al configurar el servidor. */
export async function verifyMailer(): Promise<MailResult> {
  const transport = getTransporter();
  if (!transport) return { sent: false, reason: "SMTP no configurado" };

  try {
    await transport.verify();
    return { sent: true, messageId: "verificado" };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
