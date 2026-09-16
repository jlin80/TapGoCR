import type { Metadata } from "next";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { LeadStatus } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { deleteLead, updateLead } from "@/server/contact-actions";

export const metadata: Metadata = { title: "Consultas" };

/** Consultas recibidas por el formulario del sitio comercial. */
export default async function LeadsPage() {
  await requireRoot();

  const leads = await prisma.contactLead.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = leads.filter((lead) => lead.status === LeadStatus.NEW).length;

  return (
    <>
      <PageHeader
        title="Consultas"
        description={
          pending > 0
            ? `${pending} consulta${pending === 1 ? "" : "s"} sin atender.`
            : "Mensajes enviados desde la página pública de TapGoCR."
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="Todavía no hay consultas"
          description="Acá van a aparecer los mensajes que envíen desde el formulario de contacto."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Card className="p-0">
                <details className="group" open={lead.status === LeadStatus.NEW}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3">
                    <Badge tone={LEAD_STATUS_TONES[lead.status]}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {lead.businessName ?? lead.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {lead.name} · {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                      </span>
                    </span>

                    <span className="text-xs text-muted">
                      {formatDate(lead.createdAt)}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-muted transition-transform group-open:rotate-90"
                    >
                      &rsaquo;
                    </span>
                  </summary>

                  <div className="border-t border-border px-4 py-4">
                    <p className="whitespace-pre-line rounded-lg bg-surface-muted p-4 text-sm">
                      {lead.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-brand hover:underline"
                      >
                        Responder por correo
                      </a>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                          className="text-brand hover:underline"
                        >
                          Llamar
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <ActionForm
                        action={updateLead}
                        submitLabel="Guardar"
                        footer={
                          <form action={deleteLead}>
                            <input type="hidden" name="leadId" value={lead.id} />
                            <SubmitButton
                              variant="danger"
                              confirm="¿Eliminar esta consulta? No se puede deshacer."
                            >
                              Eliminar
                            </SubmitButton>
                          </form>
                        }
                      >
                        <input type="hidden" name="leadId" value={lead.id} />

                        <Field label="Estado">
                          <Select name="status" defaultValue={lead.status}>
                            {Object.values(LeadStatus).map((status) => (
                              <option key={status} value={status}>
                                {LEAD_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Notas internas">
                          <Textarea
                            name="notes"
                            maxLength={2000}
                            defaultValue={lead.notes ?? ""}
                            placeholder="Qué se conversó, qué se cotizó…"
                          />
                        </Field>
                      </ActionForm>
                    </div>
                  </div>
                </details>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
