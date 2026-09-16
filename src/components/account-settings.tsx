import { ActionForm } from "@/components/action-form";
import { Card, Field, Input } from "@/components/ui";
import { appName, tapgoOrigin } from "@/lib/config";
import { changeOwnPassword } from "@/server/user-actions";

/**
 * Configuración de la cuenta. Es idéntica para administración y cliente: cambiar
 * la propia contraseña y ver cómo está configurada la plataforma.
 */
export function AccountSettings({
  email,
  showPlatformInfo = false,
}: {
  email: string | null;
  showPlatformInfo?: boolean;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <h2 className="mb-1 font-medium">Cambiar contraseña</h2>
        <p className="mb-4 text-sm text-muted">
          Sesión iniciada como {email ?? "—"}.
        </p>

        <ActionForm action={changeOwnPassword} submitLabel="Actualizar contraseña">
          <Field label="Contraseña actual">
            <Input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>

          <Field label="Nueva contraseña" hint="Mínimo 12 caracteres.">
            <Input
              name="newPassword"
              type="password"
              required
              minLength={12}
              maxLength={200}
              autoComplete="new-password"
            />
          </Field>
        </ActionForm>
      </Card>

      {showPlatformInfo ? (
        <Card>
          <h2 className="mb-3 font-medium">Configuración de la plataforma</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Marca</dt>
              <dd className="font-medium">{appName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Dominio público</dt>
              <dd className="font-mono text-xs">{tapgoOrigin}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Formato de URL de tag</dt>
              <dd className="font-mono text-xs">{tapgoOrigin}/t/&#123;code&#125;</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Estos valores vienen de las variables de entorno
            NEXT_PUBLIC_TAPGO_DOMAIN, NEXT_PUBLIC_TAPGO_PROTOCOL y
            NEXT_PUBLIC_APP_NAME. Cambiar de dominio no requiere tocar el código ni
            reprogramar los NFC ya instalados que apunten al dominio nuevo.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
