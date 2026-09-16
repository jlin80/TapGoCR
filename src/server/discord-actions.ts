"use server";

import type { ActionState } from "@/lib/action-state";
import { requireRoot } from "@/lib/authz";
import { CHANNEL_LABELS, isChannelConfigured, type DiscordChannel } from "@/lib/discord/channels";
import { sendDiscordMessage } from "@/lib/discord/service";

const CHANNELS = Object.keys(CHANNEL_LABELS) as DiscordChannel[];

/** Estado de cada canal para el panel de admin. Nunca incluye el webhook. */
export async function discordChannelStatus(): Promise<
  Array<{ channel: DiscordChannel; label: string; configured: boolean }>
> {
  await requireRoot();
  return CHANNELS.map((channel) => ({
    channel,
    label: CHANNEL_LABELS[channel],
    configured: isChannelConfigured(channel),
  }));
}

/**
 * Envía un mensaje de prueba a un canal. Corre exclusivamente en el
 * servidor — el formulario solo manda el nombre del canal, nunca un
 * webhook.
 */
export async function sendDiscordTest(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoot();

  const channel = String(formData.get("channel") ?? "") as DiscordChannel;
  if (!CHANNELS.includes(channel)) return { error: "Canal inválido." };

  if (!isChannelConfigured(channel)) {
    return { error: `${CHANNEL_LABELS[channel]} no tiene webhook configurado todavía.` };
  }

  const result = await sendDiscordMessage(channel, {
    eventId: `manual-test:${channel}:${Date.now()}`,
    embeds: [
      {
        title: "✅ Prueba de TapGoCR",
        description: `Este es un mensaje de prueba para ${CHANNEL_LABELS[channel]}, enviado desde el panel de administración.`,
        color: 0x00b86b,
        timestamp: new Date().toISOString(),
      },
    ],
  });

  if (!result.sent) {
    return { error: `No se pudo enviar la prueba (${result.reason}). Revisá el webhook.` };
  }

  return { success: `Prueba enviada a ${CHANNEL_LABELS[channel]}. Revisá Discord.` };
}
