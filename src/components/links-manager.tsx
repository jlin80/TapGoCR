import { ActionForm } from "@/components/action-form";
import { AddLinkCard } from "@/components/add-link-card";
import { SubmitButton } from "@/components/confirm-button";
import { LinkIcon } from "@/components/link-icon";
import { Badge, Card, Checkbox, EmptyState, Field, Input, LinkButton, Select } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";
import { LINK_TYPE_LABELS, LINK_TYPE_ORDER } from "@/lib/link-types";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";
import {
  createLink,
  deleteLink,
  moveLink,
  updateLink,
} from "@/server/link-actions";
import { createUploadedLink } from "@/server/upload-actions";

export type ManagedLink = {
  id: string;
  type: LinkType;
  label: string;
  url: string;
  active: boolean;
};

/**
 * Editor de los enlaces que aparecen en la landing.
 *
 * Lo usan tanto el panel administrativo como el del cliente; las server actions
 * verifican el acceso al negocio en ambos casos, así que compartir el
 * componente no relaja ningún permiso.
 */
export function LinksManager({
  businessId,
  links,
}: {
  businessId: string;
  links: ManagedLink[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {links.length === 0 ? (
        <EmptyState
          title="Sin enlaces todavía"
          description="Agregá el menú, WhatsApp y las redes para que aparezcan en la landing."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link, index) => (
            <li key={link.id}>
              <Card className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                    <span className="text-brand">
                      <LinkIcon type={link.type} className="size-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{link.label}</span>
                      <span className="block truncate text-xs text-muted">
                        {link.url}
                      </span>
                    </span>

                    {!link.active ? <Badge tone="neutral">Oculto</Badge> : null}

                    <span
                      aria-hidden="true"
                      className="text-muted transition-transform group-open:rotate-90"
                    >
                      &rsaquo;
                    </span>
                  </summary>

                  <div className="border-t border-border px-4 py-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <form action={moveLink}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="direction" value="up" />
                        <SubmitButton title="Subir">↑ Subir</SubmitButton>
                      </form>

                      <form action={moveLink}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <input type="hidden" name="direction" value="down" />
                        <SubmitButton title="Bajar">↓ Bajar</SubmitButton>
                      </form>

                      <form action={deleteLink}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <SubmitButton
                          variant="danger"
                          confirm={`¿Eliminar el enlace "${link.label}"?`}
                        >
                          Eliminar
                        </SubmitButton>
                      </form>

                      <span className="ml-auto self-center text-xs text-muted">
                        Posición {index + 1}
                      </span>
                    </div>

                    <ActionForm
                      action={updateLink}
                      submitLabel="Guardar cambios"
                      className="flex flex-col gap-3"
                    >
                      <input type="hidden" name="linkId" value={link.id} />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Tipo">
                          <Select name="type" defaultValue={link.type}>
                            {LINK_TYPE_ORDER.map((type) => (
                              <option key={type} value={type}>
                                {LINK_TYPE_LABELS[type]}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Texto del botón">
                          <Input name="label" required maxLength={60} defaultValue={link.label} />
                        </Field>
                      </div>

                      <Field
                        label="URL"
                        hint={
                          link.type === LinkType.GOOGLE_REVIEWS
                            ? "Este enlace se abrirá cuando un cliente quiera publicar su experiencia en Google, después de dejar su feedback en TapGoCR."
                            : undefined
                        }
                      >
                        <Input
                          name="url"
                          required
                          maxLength={2048}
                          defaultValue={link.url}
                        />
                      </Field>

                      {link.type === LinkType.GOOGLE_REVIEWS && link.url ? (
                        <LinkButton href={link.url} target="_blank" rel="noopener noreferrer">
                          Probar enlace
                        </LinkButton>
                      ) : null}

                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox name="active" defaultChecked={link.active} />
                        Visible en la landing
                      </label>
                    </ActionForm>
                  </div>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AddLinkCard
        businessId={businessId}
        createLink={createLink}
        createUploadedLink={createUploadedLink}
        maxUploadBytes={MAX_UPLOAD_BYTES}
      />
    </div>
  );
}
