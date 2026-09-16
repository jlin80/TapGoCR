import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import {
  Badge,
  Card,
  Checkbox,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Select,
  StatCard,
} from "@/components/ui";
import { ScanEventType } from "@/generated/prisma/enums";
import { requireRoot, requireTagAccess } from "@/lib/authz";
import { appName, tagUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { qrSvgForCode } from "@/lib/qr";
import { reassignTag, toggleTagActive, updateTag } from "@/server/tag-actions";

export const metadata: Metadata = { title: "Producción del tag" };

/**
 * Pantalla de producción de un tag: reúne todo lo necesario para fabricarlo e
 * instalarlo —URL para programar el NFC, QR para imprimir y estado— en un solo
 * lugar.
 */
export default async function TagDetailPage({ params }: PageProps<"/app/tags/[id]">) {
  const { id } = await params;
  await requireRoot();
  await requireTagAccess(id);

  const tag = await prisma.tag.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      locationLabel: true,
      active: true,
      business: { select: { id: true, name: true } },
      _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
    },
  });

  const [qrSvg, businesses] = await Promise.all([
    qrSvgForCode(tag.code),
    prisma.business.findMany({
      where: { id: { not: tag.business.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const url = tagUrl(tag.code);

  return (
    <>
      <PageHeader
        title={tag.name}
        description={`${tag.business.name}${tag.locationLabel ? ` · ${tag.locationLabel}` : ""}`}
        actions={
          <>
            <LinkButton href={`/app/businesses/${tag.business.id}/tags`}>
              Ver todos los tags
            </LinkButton>
            <LinkButton href={url} target="_blank" rel="noopener noreferrer">
              Probar landing
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Datos de producción
            </h2>

            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-muted">Negocio</dt>
                <dd className="font-medium">{tag.business.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Código</dt>
                <dd className="font-mono">{tag.code}</dd>
              </div>
              <div>
                <dt className="text-muted">URL para programar el NFC</dt>
                <dd className="break-all font-mono text-xs">{url}</dd>
              </div>
              <div>
                <dt className="text-muted">Estado</dt>
                <dd>
                  <Badge tone={tag.active ? "success" : "neutral"}>
                    {tag.active ? "Activo" : "Inactivo"}
                  </Badge>
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton value={url} />
              <LinkButton href={`/api/tags/${tag.id}/qr`} download>
                Descargar QR
              </LinkButton>
              <form action={toggleTagActive}>
                <input type="hidden" name="tagId" value={tag.id} />
                <SubmitButton
                  confirm={
                    tag.active
                      ? "La landing pasará a mostrar el aviso de tag inactivo. ¿Continuar?"
                      : undefined
                  }
                >
                  {tag.active ? "Desactivar" : "Activar"}
                </SubmitButton>
              </form>
            </div>

            <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>Copiar la URL.</li>
              <li>Programarla en el NFC (NTAG213/215/216) como registro URL.</li>
              <li>Imprimir el QR sobre la placa o el sticker.</li>
              <li>Instalar y probar abriendo la landing.</li>
            </ol>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Editar tag
            </h2>
            <ActionForm action={updateTag} submitLabel="Guardar cambios">
              <input type="hidden" name="tagId" value={tag.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input name="name" required maxLength={60} defaultValue={tag.name} />
                </Field>
                <Field label="Ubicación">
                  <Input
                    name="locationLabel"
                    maxLength={80}
                    defaultValue={tag.locationLabel ?? ""}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="active" defaultChecked={tag.active} />
                Tag activo
              </label>
            </ActionForm>
          </Card>

          {businesses.length > 0 ? (
            <Card>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
                Reasignar a otro negocio
              </h2>
              <p className="mb-3 text-sm text-muted">
                La placa física y su URL no cambian: solo cambia el negocio que
                responde. Los eventos ya registrados se quedan con el negocio anterior.
              </p>

              <ActionForm
                action={reassignTag}
                submitLabel="Reasignar"
                variant="danger"
              >
                <input type="hidden" name="tagId" value={tag.id} />

                <Field label="Negocio destino">
                  <Select name="targetBusinessId" required defaultValue="">
                    <option value="" disabled>
                      Seleccioná un negocio
                    </option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox name="confirm" />
                  Confirmo la reasignación administrativa de este tag.
                </label>
              </ActionForm>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {appName}
            </p>
            <div
              className="w-full max-w-[240px] [&>svg]:h-auto [&>svg]:w-full"
              // El SVG lo genera la librería de QR a partir de una URL propia.
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="font-mono text-xs break-all text-muted">{url}</p>
          </Card>

          <StatCard label="Scans registrados" value={tag._count.events} />

          <Card>
            <p className="text-sm text-muted">
              ¿Necesitás las estadísticas completas?{" "}
              <Link
                href={`/app/businesses/${tag.business.id}/analytics`}
                className="text-brand hover:underline"
              >
                Ver analytics del negocio
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
