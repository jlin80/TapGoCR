/**
 * Canales de Discord y sus eventos.
 *
 * Un canal = una variable de entorno `DISCORD_WEBHOOK_*` = un webhook. Nunca
 * se lee `process.env` con acceso dinámico (`process.env[nombre]`): cada
 * variable se referencia literal, para que quede visible en el código qué
 * secretos existen y Next.js pueda inlinear correctamente en build.
 *
 * Este archivo NUNCA importa nada de Prisma ni de Next — es la única fuente
 * de verdad de "qué canal existe y qué webhook le corresponde", y tiene que
 * poder usarse tanto desde server actions como desde scripts standalone
 * (igual criterio que `src/lib/domain-notices.ts`).
 */

export type DiscordChannel =
  | "NEW_CLIENTS"
  | "REQUESTS"
  | "TASKS"
  | "SALES"
  | "ACTIVITY"
  | "ALERTS"
  | "ERRORS"
  | "UPTIME"
  | "DEPLOYMENTS"
  | "BUGS"
  | "ADMIN"
  | "SECURITY"
  | "LOGS";

/** Nombre del canal en el servidor de Discord, solo para mostrar en el panel. */
export const CHANNEL_LABELS: Record<DiscordChannel, string> = {
  NEW_CLIENTS: "#nuevos-clientes",
  REQUESTS: "#solicitudes",
  TASKS: "#tareas",
  SALES: "#ventas",
  ACTIVITY: "#actividad",
  ALERTS: "#alertas",
  ERRORS: "#errores",
  UPTIME: "#uptime",
  DEPLOYMENTS: "#deployments",
  BUGS: "#bugs",
  ADMIN: "#admin",
  SECURITY: "#seguridad",
  LOGS: "#logs",
};

/**
 * Devuelve el webhook configurado para un canal, o `null` si no está
 * configurado. Es la ÚNICA función del proyecto que puede leer el valor real
 * de un `DISCORD_WEBHOOK_*` — todo lo demás pasa por acá, nunca por
 * `process.env` directo, para que sea imposible que el valor real se filtre
 * a un log o a una respuesta por accidente en otro archivo.
 */
export function webhookFor(channel: DiscordChannel): string | null {
  const value = webhookEnvValue(channel)?.trim();
  return value ? value : null;
}

/** ¿Está configurado? Para el panel de admin, que nunca debe ver el valor. */
export function isChannelConfigured(channel: DiscordChannel): boolean {
  return webhookFor(channel) !== null;
}

function webhookEnvValue(channel: DiscordChannel): string | undefined {
  switch (channel) {
    case "NEW_CLIENTS":
      return process.env.DISCORD_WEBHOOK_NEW_CLIENTS;
    case "REQUESTS":
      return process.env.DISCORD_WEBHOOK_REQUESTS;
    case "TASKS":
      return process.env.DISCORD_WEBHOOK_TASKS;
    case "SALES":
      return process.env.DISCORD_WEBHOOK_SALES;
    case "ACTIVITY":
      return process.env.DISCORD_WEBHOOK_ACTIVITY;
    case "ALERTS":
      return process.env.DISCORD_WEBHOOK_ALERTS;
    case "ERRORS":
      return process.env.DISCORD_WEBHOOK_ERRORS;
    case "UPTIME":
      return process.env.DISCORD_WEBHOOK_UPTIME;
    case "DEPLOYMENTS":
      return process.env.DISCORD_WEBHOOK_DEPLOYMENTS;
    case "BUGS":
      return process.env.DISCORD_WEBHOOK_BUGS;
    case "ADMIN":
      return process.env.DISCORD_WEBHOOK_ADMIN;
    case "SECURITY":
      return process.env.DISCORD_WEBHOOK_SECURITY;
    case "LOGS":
      return process.env.DISCORD_WEBHOOK_LOGS;
  }
}
