"use client";

import { useState } from "react";

import { ActionForm } from "@/components/action-form";
import { Card, Checkbox, Field, Input, Select } from "@/components/ui";
import { LinkType } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";
import { LINK_TYPE_LABELS, LINK_TYPE_ORDER } from "@/lib/link-types";

type ServerAction = (previous: ActionState, formData: FormData) => Promise<ActionState>;

// Duplicado a propósito, no importado de `@/lib/uploads`: ese módulo abre con
// `node:fs/promises` a nivel de archivo, y Turbopack no puede excluirlo del
// bundle del navegador aunque acá solo se use una constante. `maxUploadBytes`
// sí llega por prop desde el servidor, que puede importar ese módulo sin problema.
const UPLOAD_ACCEPT = ".pdf,image/png,image/jpeg,image/webp";

/**
 * Alta de un enlace nuevo, con la opción de subir un archivo en vez de pegar
 * una URL.
 *
 * Es un solo selector de tipo, no dos formularios con cada uno el suyo: la
 * opción de subir archivo solo tiene sentido para un menú (un PDF o una foto
 * de la carta), así que aparece únicamente cuando el tipo elegido es MENU, en
 * vez de estar siempre visible sin importar qué se esté por agregar.
 *
 * Las server actions llegan por prop en lugar de importarse acá: importarlas
 * directo en un componente cliente hacía que Turbopack intentara empaquetar
 * `node:fs/promises` (que usa `saveUpload`) para el navegador y fallaba el
 * build. Pasarlas como props es además el patrón que Next.js recomienda.
 */
export function AddLinkCard({
  businessId,
  createLink,
  createUploadedLink,
  maxUploadBytes,
}: {
  businessId: string;
  createLink: ServerAction;
  createUploadedLink: ServerAction;
  maxUploadBytes: number;
}) {
  const [type, setType] = useState<LinkType>(LinkType.MENU);
  const isMenu = type === LinkType.MENU;

  return (
    <Card>
      <h3 className="mb-3 font-medium">Agregar enlace</h3>

      <ActionForm action={createLink} submitLabel="Agregar" pendingLabel="Agregando…">
        <input type="hidden" name="businessId" value={businessId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <Select
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as LinkType)}
            >
              {LINK_TYPE_ORDER.map((item) => (
                <option key={item} value={item}>
                  {LINK_TYPE_LABELS[item]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Texto del botón">
            <Input name="label" required maxLength={60} placeholder="Ver menú" />
          </Field>
        </div>

        <Field label="URL" hint="Debe empezar con https://, http://, mailto: o tel:">
          <Input
            name="url"
            required
            maxLength={2048}
            placeholder="https://burgerlab.com/menu.pdf"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="active" defaultChecked />
          Visible en la landing
        </label>
      </ActionForm>

      {isMenu ? (
        <div className="mt-6 border-t border-border pt-6">
          <h4 className="mb-1 font-medium">O subí un archivo en vez de una URL</h4>
          <p className="mb-3 text-sm text-muted">
            Para un menú en PDF o una foto de la carta. Máximo{" "}
            {Math.round(maxUploadBytes / (1024 * 1024))} MB.
          </p>

          <ActionForm
            action={createUploadedLink}
            submitLabel="Subir y agregar"
            pendingLabel="Subiendo…"
          >
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="type" value={LinkType.MENU} />

            <Field label="Texto del botón">
              <Input name="label" required maxLength={60} placeholder="Ver menú" />
            </Field>

            <Field label="Archivo" hint="PDF, JPG, PNG o WEBP.">
              <Input type="file" name="file" required accept={UPLOAD_ACCEPT} />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="active" defaultChecked />
              Visible en la landing
            </label>
          </ActionForm>
        </div>
      ) : null}
    </Card>
  );
}
