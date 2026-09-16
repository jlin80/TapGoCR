import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { LinksManager } from "@/components/links-manager";
import { NoBusinessAssigned } from "@/components/no-business";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { LandingTheme, MenuMode } from "@/generated/prisma/enums";
import { requireClient } from "@/lib/authz";
import { primaryBusinessId } from "@/lib/authz";
import { tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { THEME_LABELS } from "@/lib/theme";
import { updatePublicProfile, uploadProfileImage } from "@/server/profile-actions";

export const metadata: Metadata = { title: "Mi página pública" };

/** Sin PDF a propósito: un logo o una portada son siempre una imagen. */
const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * Lo que ve alguien al acercar el teléfono al NFC.
 *
 * El negocio se deriva de la sesión, nunca de la URL: no hay ningún parámetro
 * que manipular para editar el perfil de otro. El `businessId` que viaja en el
 * formulario se vuelve a validar en la server action con `requireBusinessAccess`.
 */
export default async function ClientProfilePage() {
  const user = await requireClient();
  const businessId = await primaryBusinessId(user);

  if (!businessId) {
    return (
      <>
        <PageHeader title="Mi página pública" />
        <NoBusinessAssigned />
      </>
    );
  }

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      logoUrl: true,
      coverUrl: true,
      brandColor: true,
      accentColor: true,
      menuMode: true,
      landingTheme: true,
      links: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, type: true, label: true, url: true, active: true },
      },
      tags: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { code: true },
      },
    },
  });

  const previewCode = business.tags[0]?.code ?? null;

  return (
    <>
      <PageHeader
        title="Mi página pública"
        description="Es lo que ve tu cliente al tocar el NFC o escanear el QR. Los cambios se aplican al instante, sin reprogramar la placa."
      />

      <div className="flex flex-col gap-8">
        {previewCode ? (
          <Card>
            <p className="text-sm">
              Tu página:{" "}
              <a
                href={`/t/${previewCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline underline-offset-2"
              >
                {tagUrl(previewCode)}
              </a>
            </p>
          </Card>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Información</h2>
          <Card>
            <ActionForm action={updatePublicProfile} submitLabel="Guardar cambios">
              <input type="hidden" name="businessId" value={business.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del negocio">
                  <Input
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={business.name}
                  />
                </Field>

                <Field label="Categoría" hint="Ejemplo: Restaurante, Cafetería, Barbería">
                  <Input
                    name="category"
                    maxLength={60}
                    defaultValue={business.category ?? ""}
                    placeholder="Restaurante"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Descripción">
                    <Textarea
                      name="description"
                      maxLength={300}
                      defaultValue={business.description ?? ""}
                      placeholder="Hamburguesas artesanales en el centro de Heredia"
                    />
                  </Field>
                </div>

                <Field label="Logo (URL)" hint="Cuadrado, mínimo 200×200 px">
                  <Input
                    name="logoUrl"
                    type="url"
                    maxLength={2048}
                    defaultValue={business.logoUrl ?? ""}
                    placeholder="https://…/logo.png"
                  />
                </Field>

                <Field label="Portada (URL)" hint="Horizontal, proporción 16:9">
                  <Input
                    name="coverUrl"
                    type="url"
                    maxLength={2048}
                    defaultValue={business.coverUrl ?? ""}
                    placeholder="https://…/portada.jpg"
                  />
                </Field>

                <Field label="Color principal" hint="Hexadecimal, por ejemplo #c1121f">
                  <Input
                    name="brandColor"
                    maxLength={7}
                    pattern="#[0-9a-fA-F]{6}"
                    defaultValue={business.brandColor ?? ""}
                    placeholder="#0d9488"
                  />
                </Field>

                <Field
                  label="Color secundario"
                  hint="Opcional. Se usa al pulsar un botón."
                >
                  <Input
                    name="accentColor"
                    maxLength={7}
                    pattern="#[0-9a-fA-F]{6}"
                    defaultValue={business.accentColor ?? ""}
                    placeholder="#0f766e"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label="Tema"
                    hint="Cambia tipografía, formas y espaciado de tu página. El logo y los colores se mantienen."
                  >
                    <Select name="landingTheme" defaultValue={business.landingTheme}>
                      {Object.values(LandingTheme).map((theme) => (
                        <option key={theme} value={theme}>
                          {THEME_LABELS[theme]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Menú"
                    hint="Con «enlace o PDF» el botón abre la URL del enlace de tipo Menú. Con «menú digital» abre la carta que cargás en TapGoCR."
                  >
                    <Select name="menuMode" defaultValue={business.menuMode}>
                      <option value={MenuMode.LINK}>Enlace o PDF</option>
                      <option value={MenuMode.NATIVE}>Menú digital de TapGoCR</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </ActionForm>
          </Card>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold">Imágenes</h2>
          <p className="mb-3 text-sm text-muted">
            Subí el archivo directo en vez de pegar una URL. Reemplaza a la que
            hubiera cargada arriba.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <ActionForm
                action={uploadProfileImage}
                submitLabel="Subir logo"
                pendingLabel="Subiendo…"
              >
                <input type="hidden" name="businessId" value={business.id} />
                <input type="hidden" name="field" value="logo" />
                <Field label="Logo" hint="Cuadrado, mínimo 200×200 px. JPG, PNG o WEBP.">
                  <Input type="file" name="file" required accept={IMAGE_UPLOAD_ACCEPT} />
                </Field>
              </ActionForm>
            </Card>

            <Card>
              <ActionForm
                action={uploadProfileImage}
                submitLabel="Subir portada"
                pendingLabel="Subiendo…"
              >
                <input type="hidden" name="businessId" value={business.id} />
                <input type="hidden" name="field" value="cover" />
                <Field label="Portada" hint="Horizontal, proporción 16:9. JPG, PNG o WEBP.">
                  <Input type="file" name="file" required accept={IMAGE_UPLOAD_ACCEPT} />
                </Field>
              </ActionForm>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold">Botones</h2>
          <p className="mb-3 text-sm text-muted">
            Solo aparecen los botones que tienen una URL configurada. Los de WhatsApp,
            llamada y cómo llegar se agregan solos cuando TapGoCR tiene esos datos
            cargados.
          </p>
          <LinksManager businessId={business.id} links={business.links} />
        </section>
      </div>
    </>
  );
}
