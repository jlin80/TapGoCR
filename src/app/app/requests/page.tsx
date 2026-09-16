import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
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
import {
  RequestPriority,
  RequestStatus,
  RequestType,
} from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import {
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  REQUEST_TYPE_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  advanceRequestStatus,
  createRequest,
  updateRequest,
} from "@/server/request-actions";

export const metadata: Metadata = { title: "Solicitudes" };

/** Siguiente estado sugerido para el botón de avance rápido. */
const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  NEW: RequestStatus.IN_PROGRESS,
  IN_PROGRESS: RequestStatus.COMPLETED,
  WAITING_CLIENT: RequestStatus.IN_PROGRESS,
};

export default async function RequestsPage() {
  await requireRoot();

  const [requests, businesses] = await Promise.all([
    prisma.serviceRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Solicitudes"
        description="Pedidos de dominio, sitio web, hosting y mantenimiento."
      />

      <div className="flex flex-col gap-6">
        {requests.length === 0 ? (
          <EmptyState
            title="No hay solicitudes"
            description="Aparecerán acá cuando un cliente pida un servicio o cuando las creés vos."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((request) => {
              const next = NEXT_STATUS[request.status];

              return (
                <li key={request.id}>
                  <Card className="p-0">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                        <Badge tone={REQUEST_STATUS_TONES[request.status]}>
                          {REQUEST_STATUS_LABELS[request.status]}
                        </Badge>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {request.title}
                          </span>
                          <span className="block text-xs text-muted">
                            {request.business.name} ·{" "}
                            {REQUEST_TYPE_LABELS[request.type]} ·{" "}
                            {formatDate(request.createdAt)}
                          </span>
                        </span>

                        <span className="text-xs text-muted">
                          {REQUEST_PRIORITY_LABELS[request.priority]}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-muted transition-transform group-open:rotate-90"
                        >
                          &rsaquo;
                        </span>
                      </summary>

                      <div className="border-t border-border px-4 py-4">
                        {request.description ? (
                          <p className="mb-4 whitespace-pre-line text-sm text-muted">
                            {request.description}
                          </p>
                        ) : null}

                        <div className="mb-4 flex flex-wrap gap-2">
                          {next ? (
                            <form action={advanceRequestStatus}>
                              <input type="hidden" name="requestId" value={request.id} />
                              <input type="hidden" name="status" value={next} />
                              <SubmitButton variant="primary">
                                Marcar como {REQUEST_STATUS_LABELS[next].toLowerCase()}
                              </SubmitButton>
                            </form>
                          ) : null}

                          <Link
                            href={`/app/businesses/${request.business.id}`}
                            className="self-center text-sm text-brand hover:underline"
                          >
                            Ver negocio
                          </Link>
                        </div>

                        <ActionForm action={updateRequest} submitLabel="Guardar">
                          <input type="hidden" name="requestId" value={request.id} />
                          <RequestFields request={request} />
                        </ActionForm>
                      </div>
                    </details>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {businesses.length > 0 ? (
          <Card className="max-w-3xl">
            <h3 className="mb-3 font-medium">Nueva solicitud</h3>
            <ActionForm action={createRequest} submitLabel="Crear solicitud">
              <Field label="Negocio">
                <Select name="businessId" required defaultValue="">
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
              <RequestFields />
            </ActionForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}

type RequestRow = {
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
};

function RequestFields({ request }: { request?: RequestRow }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tipo">
          <Select name="type" defaultValue={request?.type ?? RequestType.WEBSITE}>
            {Object.values(RequestType).map((type) => (
              <option key={type} value={type}>
                {REQUEST_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Estado">
          <Select name="status" defaultValue={request?.status ?? RequestStatus.NEW}>
            {Object.values(RequestStatus).map((status) => (
              <option key={status} value={status}>
                {REQUEST_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Prioridad">
          <Select
            name="priority"
            defaultValue={request?.priority ?? RequestPriority.NORMAL}
          >
            {Object.values(RequestPriority).map((priority) => (
              <option key={priority} value={priority}>
                {REQUEST_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Título">
        <Input
          name="title"
          required
          maxLength={120}
          defaultValue={request?.title}
          placeholder="Crear página web"
        />
      </Field>

      <Field label="Descripción">
        <Textarea
          name="description"
          maxLength={2000}
          defaultValue={request?.description ?? ""}
        />
      </Field>
    </>
  );
}
