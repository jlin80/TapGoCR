/**
 * Event Dispatcher compartido de TapGoCR.
 *
 * Un server action llama UNA función acá (`emitNewClient`, etc.) en vez de
 * llamar a Discord y a Email por separado — así ningún servicio de negocio
 * conoce los detalles de ninguno de los dos canales, y agregar un tercero
 * (push, SMS...) el día de mañana no toca los server actions de nuevo.
 *
 * Los dos consumidores corren independientes vía `Promise.allSettled`: si
 * Discord falla, Email igual se intenta, y viceversa. Ninguno de los dos
 * puede lanzar (ya lo garantizan `sendDiscordMessage` y
 * `sendEmailNotification` por su cuenta), así que esto tampoco lanza nunca.
 *
 * No reimplementa Discord: `notifyNewClient` etc. son las mismas funciones
 * de `src/lib/discord/events.ts` de siempre, solo que ahora las llama el
 * dispatcher en vez de que cada server action las importe directo.
 */
import { appName, tapgoOrigin } from "@/lib/config";
import {
  notifyContactLead as discordContactLead,
  notifyNewClient as discordNewClient,
  notifyPlanChanged as discordPlanChanged,
  notifyRequestStatusChanged as discordRequestStatusChanged,
  notifySupportRequest as discordSupportRequest,
} from "@/lib/discord/events";
import { generalRequestReceivedEmail, internalLeadEmail } from "@/lib/email/templates/general-request";
import { internalNewClientEmail } from "@/lib/email/templates/internal-new-client";
import { supportReceivedEmail } from "@/lib/email/templates/support-received";
import { supportUpdatedEmail } from "@/lib/email/templates/support-updated";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { sendEmailNotification } from "@/lib/email/service";
import { INTERNAL_EMAIL } from "@/lib/email/recipients";

const ADMIN_ORIGIN = tapgoOrigin.replace(/^https?:\/\//, "https://app.");

/** Nunca deja que un consumidor tumbe al otro ni que el error suba más arriba. */
async function settleAll(tasks: Array<Promise<unknown>>): Promise<void> {
  await Promise.allSettled(tasks);
}

// ---------------------------------------------------------------------------
// USER_CREATED + BUSINESS_CREATED
// ---------------------------------------------------------------------------

export async function emitNewClient(params: {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  clientCode: string;
  source: "AUTO" | "ROOT";
}): Promise<void> {
  const clientUrl = `${ADMIN_ORIGIN}/app/clients/${params.userId}`;

  await settleAll([
    discordNewClient(params),
    sendEmailNotification({
      notificationId: `${params.eventId}:welcome`,
      template: "welcome",
      to: params.userEmail,
      ...welcomeEmail({ name: params.userName, clientCode: params.clientCode }),
    }),
    sendEmailNotification({
      notificationId: `${params.eventId}:internal`,
      template: "internal-new-client",
      to: INTERNAL_EMAIL.info,
      ...internalNewClientEmail({
        userName: params.userName,
        userEmail: params.userEmail,
        businessName: params.businessName,
        clientCode: params.clientCode,
        source: params.source,
        adminUrl: clientUrl,
      }),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// SUPPORT_REQUEST_CREATED
// ---------------------------------------------------------------------------

export async function emitSupportRequest(params: {
  eventId: string;
  requestId: string;
  businessId: string;
  businessName: string;
  businessEmail: string | null;
  title: string;
  type: string;
  priority: string;
}): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    discordSupportRequest(params),
    sendEmailNotification({
      notificationId: `${params.eventId}:internal`,
      template: "internal-lead-support",
      to: INTERNAL_EMAIL.support,
      ...internalLeadEmail({
        department: "support",
        name: params.businessName,
        email: params.businessEmail ?? "(sin correo de contacto)",
        businessName: params.businessName,
        message: params.title,
        adminUrl: `${ADMIN_ORIGIN}/app/requests`,
      }),
    }),
  ];

  if (params.businessEmail) {
    tasks.push(
      sendEmailNotification({
        notificationId: `${params.eventId}:client`,
        template: "support-received",
        to: params.businessEmail,
        ...supportReceivedEmail({ businessName: params.businessName, title: params.title }),
      }),
    );
  }

  await settleAll(tasks);
}

// ---------------------------------------------------------------------------
// CONTACT_LEAD_CREATED (consulta general o comercial del sitio)
// ---------------------------------------------------------------------------

export async function emitContactLead(params: {
  eventId: string;
  leadId: string;
  name: string;
  email: string;
  businessName?: string | null;
  messagePreview: string;
  /** El formulario público no distingue depto.: se clasifica como "info" por defecto. */
  department?: "info" | "sales";
}): Promise<void> {
  const department = params.department ?? "info";

  await settleAll([
    discordContactLead(params),
    sendEmailNotification({
      notificationId: `${params.eventId}:internal`,
      template: `internal-lead-${department}`,
      to: INTERNAL_EMAIL[department],
      ...internalLeadEmail({
        department,
        name: params.name,
        email: params.email,
        businessName: params.businessName,
        message: params.messagePreview,
        adminUrl: `${ADMIN_ORIGIN}/app/leads`,
      }),
    }),
    sendEmailNotification({
      notificationId: `${params.eventId}:client`,
      template: "general-request-received",
      to: params.email,
      ...generalRequestReceivedEmail({ name: params.name }),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// SUPPORT_REQUEST_UPDATED — cambio de estado de una solicitud ya existente.
// ---------------------------------------------------------------------------

export async function emitRequestStatusChanged(params: {
  eventId: string;
  requestId: string;
  businessId: string;
  businessName: string;
  businessEmail: string | null;
  title: string;
  status: string;
}): Promise<void> {
  const tasks: Array<Promise<unknown>> = [discordRequestStatusChanged(params)];

  if (params.businessEmail) {
    tasks.push(
      sendEmailNotification({
        notificationId: `${params.eventId}:client`,
        template: "support-updated",
        to: params.businessEmail,
        ...supportUpdatedEmail({
          businessName: params.businessName,
          title: params.title,
          status: params.status,
        }),
      }),
    );
  }

  await settleAll(tasks);
}

// ---------------------------------------------------------------------------
// BUSINESS_PLAN_CHANGED — sin pasarela de pagos real (ver auditoría): esto
// dispara Discord y el aviso interno a sales@, pero NO un email al cliente
// todavía, porque un cambio de plan hoy lo hace ROOT a mano en el panel, no
// es una compra que el cliente inició — mandarle un email de "confirmación
// de compra" sería inventar un paso que no ocurrió.
// ---------------------------------------------------------------------------

export async function emitPlanChanged(params: {
  eventId: string;
  businessId: string;
  businessName: string;
  fromPlan: string;
  toPlan: string;
}): Promise<void> {
  await settleAll([
    discordPlanChanged(params),
    sendEmailNotification({
      notificationId: `${params.eventId}:internal`,
      template: "internal-plan-changed",
      to: INTERNAL_EMAIL.sales,
      subject: `Cambio de plan — ${appName}`,
      html: `<p>${params.businessName}: de ${params.fromPlan} a ${params.toPlan}.</p>`,
      text: `${params.businessName}: de ${params.fromPlan} a ${params.toPlan}.`,
    }),
  ]);
}
