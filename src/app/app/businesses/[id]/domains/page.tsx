import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { DomainStatus } from "@/generated/prisma/enums";
import { requireBusinessAccess } from "@/lib/authz";
import {
  DOMAIN_STATUS_LABELS,
  DOMAIN_STATUS_TONES,
  formatDate,
  toDateInput,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { createDomain, deleteDomain, updateDomain } from "@/server/service-actions";

export const metadata: Metadata = { title: "Dominios del negocio" };

export default async function BusinessDomainsPage({
  params,
}: PageProps<"/app/businesses/[id]/domains">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  const domains = await prisma.domain.findMany({
    where: { businessId: id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        El dominio es un servicio administrado: TapGoCR acompaña la compra y la
        configuración de DNS. Nunca se guardan credenciales del registrador acá.
      </p>

      {domains.length === 0 ? (
        <EmptyState
          title="Sin dominios registrados"
          description="Agregá el dominio cuando el cliente lo solicite o ya lo tenga."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {domains.map((domain) => (
            <li key={domain.id}>
              <Card className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                    <span className="font-medium">{domain.domain}</span>
                    <Badge tone={DOMAIN_STATUS_TONES[domain.status]}>
                      {DOMAIN_STATUS_LABELS[domain.status]}
                    </Badge>
                    <span className="text-xs text-muted">
                      Vence: {formatDate(domain.expiresAt)}
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
                      action={updateDomain}
                      submitLabel="Guardar"
                      footer={
                        <form action={deleteDomain}>
                          <input type="hidden" name="domainId" value={domain.id} />
                          <SubmitButton
                            variant="danger"
                            confirm={`¿Eliminar el registro de ${domain.domain}?`}
                          >
                            Eliminar
                          </SubmitButton>
                        </form>
                      }
                    >
                      <input type="hidden" name="domainId" value={domain.id} />
                      <DomainFields domain={domain} />
                    </ActionForm>
                  </div>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="max-w-3xl">
        <h3 className="mb-3 font-medium">Registrar dominio</h3>
        <ActionForm action={createDomain} submitLabel="Registrar">
          <input type="hidden" name="businessId" value={id} />
          <DomainFields />
        </ActionForm>
      </Card>
    </div>
  );
}

type DomainRow = {
  domain: string;
  status: DomainStatus;
  registrar: string | null;
  expiresAt: Date | null;
  autoRenew: boolean;
  notes: string | null;
};

function DomainFields({ domain }: { domain?: DomainRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Dominio">
        <Input
          name="domain"
          required
          maxLength={253}
          defaultValue={domain?.domain}
          placeholder="burgerlab.com"
        />
      </Field>

      <Field label="Estado">
        <Select name="status" defaultValue={domain?.status ?? DomainStatus.REQUESTED}>
          {Object.values(DomainStatus).map((status) => (
            <option key={status} value={status}>
              {DOMAIN_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Registrador">
        <Input name="registrar" maxLength={120} defaultValue={domain?.registrar ?? ""} />
      </Field>

      <Field label="Vencimiento">
        <Input
          name="expiresAt"
          type="date"
          defaultValue={toDateInput(domain?.expiresAt ?? null)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox name="autoRenew" defaultChecked={domain?.autoRenew ?? false} />
        Renovación automática contratada
      </label>

      <div className="sm:col-span-2">
        <Field label="Notas" hint="No incluyas usuarios ni contraseñas del registrador.">
          <Textarea name="notes" maxLength={1000} defaultValue={domain?.notes ?? ""} />
        </Field>
      </div>
    </div>
  );
}
