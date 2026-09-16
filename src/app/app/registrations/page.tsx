import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/confirm-button";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  StatCard,
  Textarea,
} from "@/components/ui";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { requireRoot } from "@/lib/authz";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_TONES,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  approveRegistration,
  deleteRegistration,
  rejectRegistration,
} from "@/server/registration-actions";

export const metadata: Metadata = { title: "Solicitudes de alta" };

/**
 * Solicitudes llegadas desde el registro público.
 *
 * Ninguna da acceso hasta que se apruebe: al aprobar, el sistema crea la cuenta
 * y el negocio, y le asigna un código de cliente. La persona entra con el correo
 * y la contraseña que eligió al registrarse, así que no hay que enviarle nada.
 */
export default async function RegistrationsPage() {
  await requireRoot();

  const registrations = await prisma.registration.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = registrations.filter(
    (row) => row.status === RegistrationStatus.PENDING,
  );
  const resolved = registrations.filter(
    (row) => row.status !== RegistrationStatus.PENDING,
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de alta</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Altas pedidas desde el sitio público. Nadie entra al panel hasta que
          aprobés su solicitud.
        </p>
      </div>

      <div className="mb-8 stat-rail">
        <StatCard label="Pendientes" value={pending.length} />
        <StatCard
          label="Aprobadas"
          value={
            registrations.filter((row) => row.status === RegistrationStatus.APPROVED)
              .length
          }
        />
        <StatCard
          label="Rechazadas"
          value={
            registrations.filter((row) => row.status === RegistrationStatus.REJECTED)
              .length
          }
        />
        <StatCard label="Total recibidas" value={registrations.length} />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Pendientes de revisar</h2>

        {pending.length === 0 ? (
          <EmptyState
            title="No hay solicitudes pendientes"
            description="Aparecen acá en cuanto alguien se registra en el sitio."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((registration) => (
              <li key={registration.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {registration.businessName}
                      </h3>
                      <p className="text-sm text-muted">
                        {registration.firstName} {registration.lastName} ·{" "}
                        {formatDate(registration.createdAt)}
                      </p>
                    </div>
                    <Badge tone="warning">Pendiente</Badge>
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Correo" value={registration.email} />
                    <Detail label="Teléfono" value={registration.phone} />
                    <Detail label="Cédula" value={registration.legalId} />
                    <Detail label="Dirección" value={registration.address} />
                    <Detail label="Provincia" value={registration.province} />
                    <Detail label="Cantón" value={registration.canton} />
                    <Detail label="Código postal" value={registration.postalCode} />
                  </dl>

                  {registration.notes ? (
                    <div className="mt-4 rounded-lg bg-surface-muted px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        Qué necesita
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm">
                        {registration.notes}
                      </p>
                    </div>
                  ) : null}

                  <OnlinePresenceSummary registration={registration} />

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Aprobar</h4>
                      <p className="mb-3 text-sm text-muted">
                        Crea la cuenta y el negocio, y le asigna un código de
                        cliente. Va a ingresar con la contraseña que eligió.
                      </p>
                      <ActionForm
                        action={approveRegistration}
                        submitLabel="Aprobar y crear cliente"
                        pendingLabel="Creando…"
                      >
                        <input
                          type="hidden"
                          name="registrationId"
                          value={registration.id}
                        />
                      </ActionForm>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Rechazar</h4>
                      <ActionForm
                        action={rejectRegistration}
                        submitLabel="Rechazar"
                        variant="danger"
                      >
                        <input
                          type="hidden"
                          name="registrationId"
                          value={registration.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value={RegistrationStatus.REJECTED}
                        />
                        <Field label="Motivo" hint="Interno. El cliente no lo ve.">
                          <Textarea name="reviewNotes" maxLength={1000} />
                        </Field>
                      </ActionForm>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resolved.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Resueltas</h2>
          <Card className="p-0">
            <ul className="divide-y divide-border">
              {resolved.map((registration) => (
                <li
                  key={registration.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <Badge tone={REGISTRATION_STATUS_TONES[registration.status]}>
                    {REGISTRATION_STATUS_LABELS[registration.status]}
                  </Badge>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {registration.businessName}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {registration.email}
                      {registration.reviewNotes
                        ? ` · ${registration.reviewNotes}`
                        : ""}
                    </span>
                  </span>

                  <span className="text-xs text-muted">
                    {formatDate(registration.reviewedAt)}
                  </span>

                  {registration.createdBusinessId ? (
                    <Link
                      href={`/app/clients/${registration.createdBusinessId}`}
                      className="text-sm text-brand hover:underline"
                    >
                      Ver cliente
                    </Link>
                  ) : (
                    <form action={deleteRegistration}>
                      <input
                        type="hidden"
                        name="registrationId"
                        value={registration.id}
                      />
                      <SubmitButton
                        variant="danger"
                        confirm={`¿Eliminar la solicitud de ${registration.businessName}?`}
                      >
                        Eliminar
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{value || "—"}</dd>
    </div>
  );
}

/**
 * Lo que esta solicitud va a publicar si se aprueba.
 *
 * Al aprobar, cada uno de estos campos se convierte en un enlace real de la
 * landing (ver `approveRegistration`). Mostrarlo acá evita aprobar a ciegas:
 * ROOT ve exactamente qué va a quedar publicado antes de crear la cuenta.
 */
function OnlinePresenceSummary({
  registration,
}: {
  registration: {
    whatsapp: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    googleReviewsUrl: string | null;
    menuUrl: string | null;
  };
}) {
  const items = [
    { label: "WhatsApp", value: registration.whatsapp },
    { label: "Instagram", value: registration.instagramUrl },
    { label: "Facebook", value: registration.facebookUrl },
    { label: "Google Reviews", value: registration.googleReviewsUrl },
    { label: "Menú", value: registration.menuUrl },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        No cargó redes ni menú. Va a aprobar con la landing vacía; se completa
        después desde el panel del cliente.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg bg-info-soft px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted">
        Se publica al aprobar
      </p>
      <ul className="mt-1.5 flex flex-col gap-0.5 text-sm">
        {items.map((item) => (
          <li key={item.label} className="truncate">
            <span className="font-medium">{item.label}:</span> {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
