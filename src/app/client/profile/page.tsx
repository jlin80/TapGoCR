import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { ColorField } from "@/components/color-field";
import { LinksManager } from "@/components/links-manager";
import { NoBusinessAssigned } from "@/components/no-business";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { LandingTheme, MenuMode } from "@/generated/prisma/enums";
import { requireClient } from "@/lib/authz";
import { primaryBusinessId } from "@/lib/authz";
import { tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { THEME_LABELS } from "@/lib/theme";
import { updatePublicProfile } from "@/server/profile-actions";

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
        <section id="vista-previa" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-semibold">Vista previa</h2>
          <Card>
            {previewCode ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Es exactamente lo que ve tu cliente al escanear.
                </p>
                <a
                  href={`/t/${previewCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-strong"
                >
                  Ver mi página →
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Todavía no tenés una placa activa para previsualizar tu página.
              </p>
            )}
            {previewCode ? (
              <p className="mt-3 truncate rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">
                {tagUrl(previewCode)}
              </p>
            ) : null}
          </Card>
        </section>

        {/*
          Un solo `<ActionForm>` (un solo "Guardar cambios", una sola
          validación de `updatePublicProfile`) pero dos secciones ancladas:
          el dashboard llevaba "Administrar enlaces" y "Cambiar apariencia"
          exactamente al mismo lugar, sin distinción. Ahora cada accceso
          rápido cae en su propio bloque de esta misma página.
        */}
        <ActionForm action={updatePublicProfile} submitLabel="Guardar cambios">
          <input type="hidden" name="businessId" value={business.id} />

          <section id="informacion" className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-semibold">Información</h2>
            <Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del negocio">
                  <Input name="name" required maxLength={120} defaultValue={business.name} />
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
              </div>
            </Card>
          </section>

          <section id="apariencia" className="mt-8 scroll-mt-20">
            <h2 className="mb-1 text-lg font-semibold">Apariencia</h2>
            <p className="mb-3 text-sm text-muted">
              Plantilla, fotos y colores. El contenido (menú, enlaces) no cambia.
            </p>
            <Card>
              <Field
                label="Plantilla"
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

              {/*
                Progressive disclosure: lo que casi todos los negocios dejan
                en su valor por defecto (colores manuales, URLs de imagen en
                vez de subirlas, el modo del menú) queda colapsado. Nadie
                tiene que entender "brandColor" para completar el formulario.
              */}
              <details className="mt-6 rounded-lg border border-border">
                <summary className="tap-target cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-medium select-none">
                  Configuración avanzada
                </summary>
                <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                  <Field label="Logo" hint="Cuadrado, mínimo 200×200 px. JPG, PNG o WEBP.">
                    <Input type="file" name="logoFile" accept={IMAGE_UPLOAD_ACCEPT} />
                    {business.logoUrl ? (
                      <span className="mt-1 block truncate text-xs text-muted">
                        Ya tenés uno cargado — subí otro archivo para reemplazarlo.
                      </span>
                    ) : null}
                  </Field>

                  <Field label="Portada" hint="Horizontal, proporción 16:9. JPG, PNG o WEBP.">
                    <Input type="file" name="coverFile" accept={IMAGE_UPLOAD_ACCEPT} />
                    {business.coverUrl ? (
                      <span className="mt-1 block truncate text-xs text-muted">
                        Ya tenés una cargada — subí otro archivo para reemplazarla.
                      </span>
                    ) : null}
                  </Field>

                  <Field
                    label="¿Usar los colores de tu marca?"
                    hint="Opcional. Dejalo vacío para usar los colores de TapGo."
                  >
                    <ColorField
                      name="brandColor"
                      defaultValue={business.brandColor}
                      placeholder="#0d9488"
                    />
                  </Field>

                  <Field label="Color secundario" hint="Opcional. Se usa al pulsar un botón.">
                    <ColorField
                      name="accentColor"
                      defaultValue={business.accentColor}
                      placeholder="#0f766e"
                    />
                  </Field>

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
              </details>
            </Card>
          </section>
        </ActionForm>

        <section id="enlaces" className="scroll-mt-20">
          <h2 className="mb-1 text-lg font-semibold">Acciones</h2>
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
