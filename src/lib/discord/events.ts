import type { DiscordChannel } from "@/lib/discord/channels";
import { sendDiscordMessage, type DiscordEmbed, type DiscordLinkButton } from "@/lib/discord/service";
import { tapgoOrigin } from "@/lib/config";

/**
 * Event Dispatcher de Discord.
 *
 * TapGoCR no tiene cola de trabajos ni event bus (ver auditoría): esto es
 * deliberadamente síncrono y "fire and forget" en el sentido de que nunca
 * hace esperar a quien la llama más que el timeout de un intento, y nunca
 * lanza. Se llama con `void notifyDiscord(...)` desde un server action,
 * después de que la operación principal ya tuvo éxito — mismo momento en que
 * hoy se llama `recordAudit()`.
 *
 * `app.tapgocr.com` es el origen real de los enlaces de los botones: nunca
 * `tapgoOrigin` (ese es el dominio raíz, tapgocr.com, que es la landing
 * comercial, no el panel).
 */
const ADMIN_ORIGIN = tapgoOrigin.replace(/^https?:\/\//, "https://app.");

export type EventType =
  | "USER_CREATED"
  | "BUSINESS_CREATED"
  | "SUPPORT_REQUEST_CREATED"
  | "CONTACT_LEAD_CREATED"
  | "INBOUND_EMAIL"
  | "TASK_CREATED"
  | "BUSINESS_PLAN_CHANGED"
  | "ACTIVITY_SUMMARY"
  | "SYSTEM_ALERT"
  | "SYSTEM_ERROR"
  | "SERVICE_DOWN"
  | "SERVICE_RECOVERED"
  | "DEPLOYMENT_SUCCESS"
  | "DEPLOYMENT_FAILED"
  | "BUG_CREATED"
  | "BUG_RESOLVED"
  | "SECURITY_ALERT"
  | "ADMIN_ACTION"
  | "ADMIN_LOG";

const EVENT_CHANNEL: Record<EventType, DiscordChannel> = {
  USER_CREATED: "NEW_CLIENTS",
  BUSINESS_CREATED: "NEW_CLIENTS",
  SUPPORT_REQUEST_CREATED: "REQUESTS",
  CONTACT_LEAD_CREATED: "REQUESTS",
  INBOUND_EMAIL: "REQUESTS",
  TASK_CREATED: "TASKS",
  BUSINESS_PLAN_CHANGED: "SALES",
  ACTIVITY_SUMMARY: "ACTIVITY",
  SYSTEM_ALERT: "ALERTS",
  SYSTEM_ERROR: "ERRORS",
  SERVICE_DOWN: "UPTIME",
  SERVICE_RECOVERED: "UPTIME",
  DEPLOYMENT_SUCCESS: "DEPLOYMENTS",
  DEPLOYMENT_FAILED: "DEPLOYMENTS",
  BUG_CREATED: "BUGS",
  BUG_RESOLVED: "BUGS",
  SECURITY_ALERT: "SECURITY",
  ADMIN_ACTION: "ADMIN",
  ADMIN_LOG: "LOGS",
};

// Colores de embed (decimal), consistentes con el tono de cada canal.
const COLOR = {
  brand: 0x00b86b,
  info: 0x3b82f6,
  warning: 0xf59e0b,
  danger: 0xef4444,
  neutral: 0x64748b,
};

export type DiscordEventInput = {
  eventId: string;
  embed: DiscordEmbed;
  buttons?: DiscordLinkButton[];
};

/** Envía un evento ya armado al canal que le corresponde. Nunca lanza. */
export async function notifyDiscord(type: EventType, input: DiscordEventInput): Promise<void> {
  const channel = EVENT_CHANNEL[type];
  await sendDiscordMessage(channel, {
    eventId: input.eventId,
    embeds: [{ timestamp: new Date().toISOString(), ...input.embed }],
    buttons: input.buttons,
  });
}

// ---------------------------------------------------------------------------
// #nuevos-clientes
// ---------------------------------------------------------------------------

/** USER_CREATED + BUSINESS_CREATED se disparan juntos: nacen en la misma transacción. */
export async function notifyNewClient(params: {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  clientCode: string;
  source: "AUTO" | "ROOT";
}): Promise<void> {
  await notifyDiscord("BUSINESS_CREATED", {
    eventId: params.eventId,
    embed: {
      title: "👤 Nuevo cliente",
      color: COLOR.brand,
      fields: [
        { name: "Nombre", value: params.userName, inline: true },
        { name: "Código", value: params.clientCode, inline: true },
        { name: "Email", value: params.userEmail, inline: false },
        { name: "Negocio", value: params.businessName, inline: false },
        {
          name: "Estado",
          value: params.source === "AUTO" ? "Alta automática" : "Aprobado por ROOT",
          inline: true,
        },
      ],
    },
    buttons: [
      { label: "👤 Ver cliente", url: `${ADMIN_ORIGIN}/app/clients/${params.userId}` },
      { label: "🏢 Ver negocio", url: `${ADMIN_ORIGIN}/app/businesses/${params.businessId}` },
    ],
  });
}

// ---------------------------------------------------------------------------
// #solicitudes
// ---------------------------------------------------------------------------

export async function notifySupportRequest(params: {
  eventId: string;
  requestId: string;
  businessId: string;
  businessName: string;
  title: string;
  type: string;
  priority: string;
}): Promise<void> {
  await notifyDiscord("SUPPORT_REQUEST_CREATED", {
    eventId: params.eventId,
    embed: {
      title: "📋 Nueva solicitud",
      color: params.priority === "URGENT" ? COLOR.danger : COLOR.info,
      fields: [
        { name: "Negocio", value: params.businessName, inline: true },
        { name: "Tipo", value: params.type, inline: true },
        { name: "Prioridad", value: params.priority, inline: true },
        { name: "Título", value: params.title, inline: false },
      ],
    },
    buttons: [
      { label: "📋 Ver solicitud", url: `${ADMIN_ORIGIN}/app/requests` },
      { label: "🏢 Ver negocio", url: `${ADMIN_ORIGIN}/app/businesses/${params.businessId}` },
    ],
  });
}

export async function notifyContactLead(params: {
  eventId: string;
  leadId: string;
  name: string;
  email: string;
  businessName?: string | null;
  messagePreview: string;
}): Promise<void> {
  await notifyDiscord("CONTACT_LEAD_CREATED", {
    eventId: params.eventId,
    embed: {
      title: "📧 Consulta del sitio",
      color: COLOR.info,
      fields: [
        { name: "Nombre", value: params.name, inline: true },
        { name: "Email", value: params.email, inline: true },
        ...(params.businessName ? [{ name: "Negocio", value: params.businessName, inline: true }] : []),
        { name: "Mensaje", value: params.messagePreview, inline: false },
        { name: "Estado", value: "🔴 Pendiente", inline: true },
      ],
    },
    buttons: [{ label: "📋 Ver en el panel", url: `${ADMIN_ORIGIN}/app/leads` }],
  });
}

/**
 * Correo entrante (info@/support@/sales@tapgocr.com) clasificado como
 * solicitud o consulta de cliente, vía `scripts/check-inbound-email.ts`.
 *
 * Discord solo acepta http/https en los botones de un webhook (un botón con
 * `mailto:` lo rechaza con 400), así que "Responder" va como campo de texto
 * en vez de botón: no es clickeable en todos los clientes, pero muestra la
 * dirección y el asunto listos para copiar sin abrir el correo entero.
 */
export async function notifyInboundEmail(params: {
  eventId: string;
  department: "info@tapgocr.com" | "support@tapgocr.com" | "sales@tapgocr.com";
  from: string;
  fromName?: string | null;
  subject: string;
  preview: string;
  clientName?: string | null;
  clientUrl?: string | null;
  mailboxUrl?: string | null;
}): Promise<void> {
  const buttons: DiscordLinkButton[] = [];
  if (params.mailboxUrl) buttons.push({ label: "📧 Abrir correo", url: params.mailboxUrl });
  if (params.clientUrl) buttons.push({ label: "👤 Ver cliente", url: params.clientUrl });

  const senderLabel = params.fromName ? `${params.fromName} <${params.from}>` : params.from;
  const replySubject = params.subject.startsWith("Re:") ? params.subject : `Re: ${params.subject}`;
  const mailtoUrl = `mailto:${params.from}?subject=${encodeURIComponent(replySubject)}`;

  await notifyDiscord("INBOUND_EMAIL", {
    eventId: params.eventId,
    embed: {
      title: "📧 Nuevo correo",
      color: COLOR.info,
      fields: [
        { name: "Departamento", value: params.department, inline: true },
        { name: "De", value: senderLabel, inline: true },
        { name: "Cliente", value: params.clientName ?? "Cliente no identificado", inline: true },
        { name: "Asunto", value: params.subject, inline: false },
        { name: "Responder", value: mailtoUrl, inline: false },
        { name: "Vista previa", value: params.preview, inline: false },
        { name: "Estado", value: "🔴 Pendiente", inline: true },
      ],
    },
    buttons,
  });
}

// ---------------------------------------------------------------------------
// #ventas
//
// TapGoCR no tiene pasarela de pagos (ver auditoría): no hay PAYMENT_COMPLETED
// ni SUBSCRIPTION_CREATED reales todavía. Lo más cercano que existe hoy es un
// cambio de plan, que es la señal comercial real más parecida a una venta.
// ---------------------------------------------------------------------------

export async function notifyPlanChanged(params: {
  eventId: string;
  businessId: string;
  businessName: string;
  fromPlan: string;
  toPlan: string;
}): Promise<void> {
  await notifyDiscord("BUSINESS_PLAN_CHANGED", {
    eventId: params.eventId,
    embed: {
      title: "💰 Cambio de plan",
      color: COLOR.brand,
      fields: [
        { name: "Negocio", value: params.businessName, inline: true },
        { name: "De", value: params.fromPlan, inline: true },
        { name: "A", value: params.toPlan, inline: true },
      ],
    },
    buttons: [{ label: "🏢 Ver negocio", url: `${ADMIN_ORIGIN}/app/businesses/${params.businessId}` }],
  });
}

// ---------------------------------------------------------------------------
// #tareas — seguimiento de solicitudes ya en curso (no la solicitud nueva,
// esa va a #solicitudes; acá van los cambios de estado sobre una que ya
// existe, que es lo más parecido a "progreso de una tarea" que hay hoy).
// ---------------------------------------------------------------------------

export async function notifyRequestStatusChanged(params: {
  eventId: string;
  requestId: string;
  businessId: string;
  businessName: string;
  title: string;
  status: string;
}): Promise<void> {
  await notifyDiscord("TASK_CREATED", {
    eventId: params.eventId,
    embed: {
      title: "✅ Solicitud actualizada",
      color: COLOR.info,
      fields: [
        { name: "Negocio", value: params.businessName, inline: true },
        { name: "Estado", value: params.status, inline: true },
        { name: "Título", value: params.title, inline: false },
      ],
    },
    buttons: [{ label: "📋 Ver solicitud", url: `${ADMIN_ORIGIN}/app/requests` }],
  });
}

// ---------------------------------------------------------------------------
// #actividad — SIEMPRE agregado. Nunca se llama esto por cada tap/scan
// individual; la consulta que arma estos números vive en
// `scripts/notify-activity.ts`, corrido una vez al día por un timer del
// sistema (mismo patrón que `scripts/notify-domains.ts`).
// ---------------------------------------------------------------------------

export async function notifyActivitySummary(params: {
  eventId: string;
  periodLabel: string;
  totalTaps: number;
  totalScans: number;
  activeBusinesses: number;
  topBusiness: { name: string; interactions: number } | null;
}): Promise<void> {
  await notifyDiscord("ACTIVITY_SUMMARY", {
    eventId: params.eventId,
    embed: {
      title: "📊 Actividad",
      description: params.periodLabel,
      color: COLOR.brand,
      fields: [
        { name: "NFC", value: `${params.totalTaps.toLocaleString("es-CR")} taps`, inline: true },
        { name: "QR", value: `${params.totalScans.toLocaleString("es-CR")} scans`, inline: true },
        { name: "Clientes activos", value: String(params.activeBusinesses), inline: true },
        ...(params.topBusiness
          ? [
              {
                name: "Top negocio",
                value: `${params.topBusiness.name} (${params.topBusiness.interactions})`,
                inline: false,
              },
            ]
          : []),
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #alertas — eventos críticos que requieren intervención inmediata.
//
// Sin disparador automático real todavía: TapGoCR no tiene un sistema propio
// de alertas de infraestructura. La función queda lista para conectarse el
// día que exista una señal real (por ejemplo, desde el healthcheck que arme
// #uptime).
// ---------------------------------------------------------------------------

export async function notifySystemAlert(params: {
  eventId: string;
  title: string;
  description: string;
  severity: "warning" | "critical";
}): Promise<void> {
  await notifyDiscord("SYSTEM_ALERT", {
    eventId: params.eventId,
    embed: {
      title: `🚨 ${params.title}`,
      description: params.description,
      color: params.severity === "critical" ? COLOR.danger : COLOR.warning,
      fields: [{ name: "Severidad", value: params.severity, inline: true }],
    },
  });
}

// ---------------------------------------------------------------------------
// #errores — sin disparador automático real todavía: no hay un sistema de
// captura de errores (Sentry o similar) en el proyecto. Queda lista para
// conectarse a uno.
// ---------------------------------------------------------------------------

export async function notifySystemError(params: {
  eventId: string;
  errorId: string;
  service: string;
  endpoint?: string;
  message: string;
  environment: "production" | "development";
}): Promise<void> {
  await notifyDiscord("SYSTEM_ERROR", {
    eventId: params.eventId,
    embed: {
      title: "🐞 Error del sistema",
      color: COLOR.danger,
      fields: [
        { name: "Servicio", value: params.service, inline: true },
        { name: "Ambiente", value: params.environment, inline: true },
        { name: "ID", value: params.errorId, inline: true },
        ...(params.endpoint ? [{ name: "Endpoint", value: params.endpoint, inline: false }] : []),
        { name: "Mensaje", value: params.message, inline: false },
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #uptime — sin disparador automático real todavía: no hay healthcheck ni
// monitor de uptime implementado (ver auditoría, no existe /api/health).
// Deduplicación por incidente: usar el mismo `eventId` para SERVICE_DOWN y
// su SERVICE_RECOVERED correspondiente evita que un healthcheck que reintenta
// cada minuto mande un mensaje nuevo cada vez.
// ---------------------------------------------------------------------------

export async function notifyServiceDown(params: {
  eventId: string;
  service: string;
  at: Date;
}): Promise<void> {
  await notifyDiscord("SERVICE_DOWN", {
    eventId: params.eventId,
    embed: {
      title: "🔴 SERVICE DOWN",
      color: COLOR.danger,
      fields: [
        { name: "Servicio", value: params.service, inline: true },
        { name: "Hora", value: params.at.toISOString(), inline: true },
      ],
    },
  });
}

export async function notifyServiceRecovered(params: {
  eventId: string;
  service: string;
  downtimeLabel: string;
}): Promise<void> {
  await notifyDiscord("SERVICE_RECOVERED", {
    eventId: params.eventId,
    embed: {
      title: "🟢 SERVICE RECOVERED",
      color: COLOR.brand,
      fields: [
        { name: "Servicio", value: params.service, inline: true },
        { name: "Downtime", value: params.downtimeLabel, inline: true },
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #deployments — sin disparador automático real todavía: el deploy es manual
// (ver README, no hay CI/CD). Queda lista para llamarla a mano al final de un
// deploy, o para conectar cuando exista un pipeline.
// ---------------------------------------------------------------------------

export async function notifyDeployment(params: {
  eventId: string;
  status: "success" | "failed";
  environment: string;
  version?: string;
  commit?: string;
}): Promise<void> {
  await notifyDiscord(params.status === "success" ? "DEPLOYMENT_SUCCESS" : "DEPLOYMENT_FAILED", {
    eventId: params.eventId,
    embed: {
      title: params.status === "success" ? "🚀 DEPLOYMENT SUCCESS" : "🚨 DEPLOYMENT FAILED",
      color: params.status === "success" ? COLOR.brand : COLOR.danger,
      fields: [
        { name: "Environment", value: params.environment, inline: true },
        ...(params.version ? [{ name: "Version", value: params.version, inline: true }] : []),
        ...(params.commit ? [{ name: "Commit", value: params.commit, inline: true }] : []),
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #bugs — sin disparador automático real todavía: no hay tracker de bugs en
// el proyecto (issues de GitHub u otro). Queda lista para conectarse a uno.
// ---------------------------------------------------------------------------

export async function notifyBug(params: {
  eventId: string;
  status: "created" | "resolved";
  title: string;
  severity: string;
  assignee?: string;
}): Promise<void> {
  await notifyDiscord(params.status === "created" ? "BUG_CREATED" : "BUG_RESOLVED", {
    eventId: params.eventId,
    embed: {
      title: params.status === "created" ? "🐛 Bug reportado" : "✅ Bug resuelto",
      color: params.status === "created" ? COLOR.warning : COLOR.brand,
      fields: [
        { name: "Título", value: params.title, inline: false },
        { name: "Severidad", value: params.severity, inline: true },
        ...(params.assignee ? [{ name: "Responsable", value: params.assignee, inline: true }] : []),
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #seguridad — solo eventos de seguridad importantes. Sin disparador
// automático real todavía (no hay detección de anomalías); queda lista para
// llamarla desde donde corresponda (por ejemplo, límites de rate-limit
// superados repetidamente, o cambios de contraseña de ROOT).
// ---------------------------------------------------------------------------

export async function notifySecurityAlert(params: {
  eventId: string;
  title: string;
  description: string;
}): Promise<void> {
  await notifyDiscord("SECURITY_ALERT", {
    eventId: params.eventId,
    embed: {
      title: `🔒 ${params.title}`,
      description: params.description,
      color: COLOR.danger,
    },
  });
}

// ---------------------------------------------------------------------------
// #admin — acciones administrativas relevantes (no un log infinito)
// ---------------------------------------------------------------------------

export async function notifyAdminAction(params: {
  eventId: string;
  action: string;
  actorEmail: string;
  details?: string;
}): Promise<void> {
  await notifyDiscord("ADMIN_ACTION", {
    eventId: params.eventId,
    embed: {
      title: "🛠️ Acción administrativa",
      color: COLOR.neutral,
      fields: [
        { name: "Acción", value: params.action, inline: true },
        { name: "Por", value: params.actorEmail, inline: true },
        ...(params.details ? [{ name: "Detalle", value: params.details, inline: false }] : []),
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// #logs — solo operaciones administrativas puntuales (reasignar un tag,
// cambios de configuración), nunca logs técnicos completos de la aplicación:
// esos se quedan en la consola del servidor, como siempre.
// ---------------------------------------------------------------------------

export async function notifyLogEvent(params: {
  eventId: string;
  action: string;
  actorEmail: string;
  details?: string;
}): Promise<void> {
  await notifyDiscord("ADMIN_LOG", {
    eventId: params.eventId,
    embed: {
      title: "📝 Operación registrada",
      color: COLOR.neutral,
      fields: [
        { name: "Acción", value: params.action, inline: true },
        { name: "Por", value: params.actorEmail, inline: true },
        ...(params.details ? [{ name: "Detalle", value: params.details, inline: false }] : []),
      ],
    },
  });
}
