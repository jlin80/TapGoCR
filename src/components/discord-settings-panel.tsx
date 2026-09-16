import { ActionForm } from "@/components/action-form";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { discordChannelStatus, sendDiscordTest } from "@/server/discord-actions";

/**
 * Panel "Discord / Notifications" — solo muestra Configurado/No configurado
 * por canal, nunca el webhook. El botón de prueba manda el nombre del canal
 * nada más; `sendDiscordTest` (server action) es quien realmente lee el
 * webhook y llama a Discord.
 */
export async function DiscordSettingsPanel() {
  const channels = await discordChannelStatus();

  return (
    <Card>
      <SectionTitle>Discord / Notifications</SectionTitle>
      <p className="mb-4 text-sm text-muted">
        Cada canal se activa agregando su variable{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">DISCORD_WEBHOOK_*</code>{" "}
        en el servidor. Acá nunca se ve ni se puede recuperar el valor.
      </p>

      <ul className="flex flex-col divide-y divide-border">
        {channels.map((item) => (
          <li key={item.channel} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">{item.label}</span>
              <Badge tone={item.configured ? "success" : "neutral"}>
                {item.configured ? "Configurado" : "No configurado"}
              </Badge>
            </div>

            {item.configured ? (
              <ActionForm
                action={sendDiscordTest}
                submitLabel="Enviar prueba"
                pendingLabel="Enviando…"
                variant="secondary"
                className="contents"
              >
                <input type="hidden" name="channel" value={item.channel} />
              </ActionForm>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
