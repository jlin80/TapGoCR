import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { ServiceStatus, ServiceType } from "@/generated/prisma/enums";
import { requireBusinessAccess } from "@/lib/authz";
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_TONES,
  SERVICE_TYPE_LABELS,
  formatDate,
  toDateInput,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { createService, deleteService, updateService } from "@/server/service-actions";

export const metadata: Metadata = { title: "Servicios del negocio" };

export default async function BusinessServicesPage({
  params,
}: PageProps<"/app/businesses/[id]/services">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const services = await prisma.businessService.findMany({
    where: { businessId: id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Registro de lo que TapGoCR presta a este negocio. El trabajo se ejecuta fuera
        de la plataforma; acá solo se documenta el estado.
      </p>

      {services.length === 0 ? (
        <EmptyState
          title="Sin servicios registrados"
          description="Agregá NFC, QR, landing, dominio, website, hosting o mantenimiento."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((service) => (
            <li key={service.id}>
              <Card className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                    <span className="font-medium">
                      {SERVICE_TYPE_LABELS[service.type]}
                    </span>
                    <Badge tone={SERVICE_STATUS_TONES[service.status]}>
                      {SERVICE_STATUS_LABELS[service.status]}
                    </Badge>
                    <span className="text-xs text-muted">
                      Renueva: {formatDate(service.renewalDate)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-auto text-muted transition-transform group-open:rotate-90"
                    >
                      &rsaquo;
                    </span>
                  </summary>

                  <div className="border-t border-border px-4 py-4">
                    <ActionForm
                      action={updateService}
                      submitLabel="Guardar"
                      footer={
                        <form action={deleteService}>
                          <input type="hidden" name="serviceId" value={service.id} />
                          <SubmitButton
                            variant="danger"
                            confirm="¿Eliminar este servicio del registro?"
                          >
                            Eliminar
                          </SubmitButton>
                        </form>
                      }
                    >
                      <input type="hidden" name="serviceId" value={service.id} />
                      <ServiceFields service={service} />
                    </ActionForm>
                  </div>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="max-w-3xl">
        <h3 className="mb-3 font-medium">Registrar servicio</h3>
        <ActionForm action={createService} submitLabel="Registrar">
          <input type="hidden" name="businessId" value={id} />
          <ServiceFields />
        </ActionForm>
      </Card>
    </div>
  );
}

type ServiceRow = {
  type: ServiceType;
  status: ServiceStatus;
  provider: string | null;
  notes: string | null;
  startDate: Date | null;
  renewalDate: Date | null;
  lastUpdate: Date | null;
  nextReview: Date | null;
};

function ServiceFields({ service }: { service?: ServiceRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Tipo">
        <Select name="type" defaultValue={service?.type ?? ServiceType.NFC}>
          {Object.values(ServiceType).map((type) => (
            <option key={type} value={type}>
              {SERVICE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Estado">
        <Select name="status" defaultValue={service?.status ?? ServiceStatus.LEAD}>
          {Object.values(ServiceStatus).map((status) => (
            <option key={status} value={status}>
              {SERVICE_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Proveedor" hint="Aplica sobre todo a hosting.">
        <Input name="provider" maxLength={120} defaultValue={service?.provider ?? ""} />
      </Field>

      <Field label="Inicio">
        <Input name="startDate" type="date" defaultValue={toDateInput(service?.startDate ?? null)} />
      </Field>

      <Field label="Renovación">
        <Input
          name="renewalDate"
          type="date"
          defaultValue={toDateInput(service?.renewalDate ?? null)}
        />
      </Field>

      <Field label="Última actualización" hint="Aplica a mantenimiento.">
        <Input
          name="lastUpdate"
          type="date"
          defaultValue={toDateInput(service?.lastUpdate ?? null)}
        />
      </Field>

      <Field label="Próxima revisión" hint="Aplica a mantenimiento.">
        <Input
          name="nextReview"
          type="date"
          defaultValue={toDateInput(service?.nextReview ?? null)}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Notas">
          <Textarea name="notes" maxLength={1000} defaultValue={service?.notes ?? ""} />
        </Field>
      </div>
    </div>
  );
}
