import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { NoBusinessAssigned } from "@/components/no-business";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { RequestType } from "@/generated/prisma/enums";
import { getClientContext } from "@/lib/client-context";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  REQUEST_TYPE_LABELS,
  formatDate,
} from "@/lib/labels";
import { additionalTagPriceLabel } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { createClientRequest } from "@/server/request-actions";

export const metadata: Metadata = { title: "Solicitudes" };

export default async function ClientRequestsPage({
  searchParams,
}: PageProps<"/client/requests">) {
  const { type: rawType } = await searchParams;
  const requestedType = Array.isArray(rawType) ? rawType[0] : rawType;
  const defaultType = Object.values(RequestType).includes(requestedType as RequestType)
    ? (requestedType as RequestType)
    : RequestType.WEBSITE;
  const isTagRequest = defaultType === RequestType.NFC || defaultType === RequestType.QR;

  const { business } = await getClientContext();

  if (!business) {
    return (
      <>
        <PageHeader title="Solicitudes" />
        <NoBusinessAssigned />
      </>
    );
  }

  const requests = await prisma.serviceRequest.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Solicitudes"
        description="Pedile a TapGoCR un sitio web, un dominio, hosting o mantenimiento."
      />

      <div className="flex flex-col gap-6">
        {requests.length === 0 ? (
          <EmptyState
            title="Todavía no enviaste solicitudes"
            description="Usá el formulario de abajo para pedir un servicio."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((request) => (
              <li key={request.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={REQUEST_STATUS_TONES[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                    <span className="font-medium">{request.title}</span>
                    <span className="ml-auto text-xs text-muted">
                      {REQUEST_TYPE_LABELS[request.type]} ·{" "}
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                  {request.description ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted">
                      {request.description}
                    </p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Card className="max-w-2xl">
          <h3 className="mb-3 font-medium">Nueva solicitud</h3>

          {isTagRequest ? (
            <p className="mb-4 rounded-lg bg-info-soft px-4 py-3 text-sm text-brand-strong">
              Placa adicional:{" "}
              <span className="font-medium">{additionalTagPriceLabel(business.plan)}</span>.
              No cambia tu cuota mensual por sí sola; el equipo te confirma el detalle al
              coordinar la instalación.
            </p>
          ) : null}

          <ActionForm action={createClientRequest} submitLabel="Enviar solicitud">
            <input type="hidden" name="businessId" value={business.id} />

            <Field label="¿Qué necesitás?">
              <Select name="type" defaultValue={defaultType}>
                {Object.values(RequestType).map((type) => (
                  <option key={type} value={type}>
                    {REQUEST_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Título">
              <Input
                name="title"
                required
                maxLength={120}
                defaultValue={isTagRequest ? "Placa adicional para mi local" : undefined}
                placeholder="Crear página web"
              />
            </Field>

            <Field label="Detalles">
              <Textarea
                name="description"
                maxLength={2000}
                placeholder="Contanos qué necesitás: secciones, contenido, plazos…"
              />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
