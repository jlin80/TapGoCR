import { ActionForm } from "@/components/action-form";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { emailStatus, sendEmailTest } from "@/server/email-actions";

/** Panel "Email / Notifications" — mismo criterio que el de Discord: nunca muestra credenciales. */
export async function EmailSettingsPanel() {
  const { configured } = await emailStatus();

  return (
    <Card>
      <SectionTitle>Email / Notifications</SectionTitle>
      <p className="mb-4 text-sm text-muted">
        Se activa completando <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">SMTP_HOST</code>,{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">SMTP_USER</code> y{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">SMTP_PASSWORD</code> en el servidor.
      </p>

      <div className="flex items-center justify-between gap-4">
        <Badge tone={configured ? "success" : "neutral"}>
          {configured ? "Configurado" : "No configurado"}
        </Badge>

        {configured ? (
          <ActionForm
            action={sendEmailTest}
            submitLabel="Enviar prueba"
            pendingLabel="Enviando…"
            variant="secondary"
            className="contents"
          >
            <></>
          </ActionForm>
        ) : null}
      </div>
    </Card>
  );
}
