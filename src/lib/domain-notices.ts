import type { DomainStatus } from "@/generated/prisma/enums";
import { appName, contactEmail } from "@/lib/config";
import { describeDeadline } from "@/lib/domain-expiry";

/**
 * Avisos de vencimiento de dominio.
 *
 * Redaccion deliberadamente sobria: el correo tiene que leerse como un aviso
 * util, no como una amenaza comercial. Dice que pasa, cuando, y que hacer.
 *
 * Modulo sin acceso a base de datos a proposito: la consulta vive en
 * `scripts/notify-domains.ts`, y asi las plantillas se pueden probar sin
 * levantar la base de datos.
 */

export type NoticeTarget = {
  domainId: string;
  domain: string;
  businessName: string;
  /** Correos de las personas con acceso al negocio. */
  recipients: string[];
  expiresAt: Date;
  daysLeft: number;
  stage: number;
  autoRenew: boolean;
  status: DomainStatus;
};

/**
 * Estados en los que vencer significa algo.
 *
 * Un dominio CANCELLED o en NONE no se avisa: el primero ya no se renueva a
 * proposito, y el segundo ni siquiera esta registrado.
 */
export const NOTIFIABLE_STATUSES = [
  "REGISTERED",
  "CONFIGURING",
  "ACTIVE",
  "EXPIRED",
] as const;

/**
 * Correos a los que avisar.
 *
 * Se filtran las cuentas suspendidas y los identificadores que no son un correo
 * de verdad: la cuenta ROOT usa `root` como usuario, y mandarle un aviso a esa
 * direccion solo generaria un rebote.
 */
export function recipientsOf(
  members: Array<{ user: { email: string; active: boolean } }>,
): string[] {
  return [
    ...new Set(
      members
        .filter((m) => m.user.active && m.user.email.includes("@"))
        .map((m) => m.user.email),
    ),
  ];
}

export function noticeSubject(target: NoticeTarget): string {
  if (target.daysLeft < 0) {
    return `Tu dominio ${target.domain} venció`;
  }
  if (target.daysLeft <= 7) {
    return `Urgente: ${target.domain} ${describeDeadline(target.daysLeft)}`;
  }
  return `${target.domain} ${describeDeadline(target.daysLeft)}`;
}

export function noticeBody(target: NoticeTarget): string {
  const fecha = target.expiresAt.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: process.env.TAPGO_TIMEZONE || "America/Costa_Rica",
  });

  const lines: string[] = [`Hola,`, ""];

  if (target.daysLeft < 0) {
    lines.push(
      `El dominio ${target.domain}, asociado a ${target.businessName}, venció el ${fecha}.`,
      "",
      "Mientras está vencido, el sitio web y las cuentas de correo que dependan",
      "de ese dominio dejan de funcionar. La mayoría de registradores dan un",
      "período de gracia para recuperarlo, pero es limitado y, una vez pasado,",
      "el dominio queda libre para que lo registre cualquiera.",
      "",
      "Escribinos cuanto antes para renovarlo.",
    );
  } else {
    lines.push(
      `El dominio ${target.domain}, asociado a ${target.businessName},`,
      `${describeDeadline(target.daysLeft)}: el ${fecha}.`,
      "",
    );

    if (target.autoRenew) {
      lines.push(
        "Está marcado con renovación automática, así que en principio no tenés",
        "que hacer nada. Te avisamos para que lo tengas presente y para que nos",
        "digas si preferís no renovarlo.",
      );
    } else {
      lines.push(
        "No tiene renovación automática. Si no se renueva antes de esa fecha, el",
        "sitio web y las cuentas de correo asociadas dejan de funcionar, y",
        "pasado el período de gracia del registrador el dominio queda libre.",
        "",
        "Respondé a este correo para que lo renovemos.",
      );
    }
  }

  lines.push("", "— Equipo de " + appName);

  if (contactEmail) lines.push(contactEmail);

  return lines.join("\n");
}
