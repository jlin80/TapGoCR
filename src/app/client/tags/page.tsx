import type { Metadata } from "next";

import { CopyButton } from "@/components/copy-button";
import { NoBusinessAssigned } from "@/components/no-business";
import { QuotaNotice } from "@/components/quota";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { ScanEventType } from "@/generated/prisma/enums";
import { placaQuotaFor } from "@/lib/chips";
import { getClientContext } from "@/lib/client-context";
import { tagUrl } from "@/lib/config";
import { additionalTagPriceLabel, PLAN_LABELS, nextPlanUp } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mis puntos TapGo" };

/**
 * "Punto TapGo" es el nombre de cara al cliente para lo que internamente
 * (ROOT, código, base de datos) sigue siendo un `Tag`. Ver auditoría: el
 * cliente nunca ve la palabra "tag", "código" ni "URL" como protagonistas —
 * eso vive detrás de "Más opciones", para quien de verdad lo necesita.
 */
export default async function ClientTagsPage() {
  const { business } = await getClientContext();

  if (!business) {
    return (
      <>
        <PageHeader title="Mis puntos TapGo" />
        <NoBusinessAssigned />
      </>
    );
  }

  const quota = await placaQuotaFor(business);

  const tags = await prisma.tag.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      locationLabel: true,
      active: true,
      pointGroup: { select: { id: true, name: true } },
      _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
    },
  });

  const groups = new Map<string, { name: string; tags: typeof tags }>();
  for (const tag of tags) {
    const key = tag.pointGroup?.id ?? "__none__";
    if (!groups.has(key)) groups.set(key, { name: tag.pointGroup?.name ?? "Otros puntos", tags: [] });
    groups.get(key)!.tags.push(tag);
  }
  const activeCount = tags.filter((tag) => tag.active).length;

  return (
    <>
      <PageHeader
        title="Mis puntos TapGo"
        description={
          tags.length > 0
            ? `${activeCount} ${activeCount === 1 ? "punto activo" : "puntos activos"} · 1 página compartida`
            : "Cada punto TapGo es una placa instalada en tu local."
        }
      />

      <QuotaNotice quota={quota} />

      {tags.length === 0 ? (
        <EmptyState
          title="Todavía no tenés puntos TapGo"
          description="El equipo de TapGoCR los crea y te los entrega listos para instalar."
        />
      ) : (
        <>
          <p className="mb-4 rounded-lg bg-info-soft px-4 py-3 text-sm text-brand-strong">
            Todos tus puntos comparten la misma página. Cambiá tu contenido una vez
            en &ldquo;Editar mi página&rdquo; y se actualiza en todos.
          </p>

          <div className="flex flex-col gap-6">
            {[...groups.values()].map((group) => (
              <div key={group.name}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                  {group.name}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.tags.map((tag) => {
                    const url = tagUrl(tag.code);
                    return (
                      <li key={tag.id}>
                        <Card className="flex h-full flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{tag.name}</p>
                              {tag.locationLabel ? (
                                <p className="text-xs text-muted">{tag.locationLabel}</p>
                              ) : null}
                            </div>
                            <Badge tone={tag.active ? "success" : "neutral"}>
                              {tag.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted">
                            <span className="tabular-nums font-medium text-foreground">
                              {tag._count.events.toLocaleString("es-CR")}
                            </span>{" "}
                            interacciones
                          </p>

                          <details className="mt-auto">
                            <summary className="cursor-pointer list-none text-xs font-medium text-brand select-none">
                              Más opciones
                            </summary>
                            <div className="mt-2 flex flex-col gap-2">
                              <p className="break-all rounded-lg bg-surface-muted px-3 py-2 font-mono text-xs text-muted">
                                {url}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <CopyButton value={url} label="Copiar enlace" />
                                <LinkButton href={`/api/tags/${tag.id}/qr`} download>
                                  Descargar QR
                                </LinkButton>
                              </div>
                            </div>
                          </details>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <AddPointCard quota={quota} plan={business.plan} />
    </>
  );
}

function AddPointCard({
  quota,
  plan,
}: {
  quota: Awaited<ReturnType<typeof placaQuotaFor>>;
  plan: Parameters<typeof nextPlanUp>[0];
}) {
  const willExceedPlan = quota.limit !== null && quota.activeTags + 1 > quota.limit;
  const suggested = willExceedPlan ? nextPlanUp(plan) : null;

  return (
    <Card className="mt-8 max-w-xl">
      <h3 className="font-medium">Agregar punto TapGo</h3>
      <p className="mt-1 text-sm text-muted">
        Nosotros programamos y entregamos todo listo para instalar. Contanos
        cuántos necesitás, dónde los vas a colocar y para qué los querés usar.
      </p>
      <p className="mt-2 text-sm text-muted">
        Precio: <span className="font-medium text-foreground">{additionalTagPriceLabel(plan)}</span>.
        No cambia tu cuota mensual por sí solo.
      </p>

      {suggested ? (
        <p className="mt-2 text-sm text-warning">
          Un punto más te saca de los incluidos en tu plan actual. Con el plan{" "}
          {PLAN_LABELS[suggested]} quedarías cubierto.
        </p>
      ) : null}

      <div className="mt-4">
        <LinkButton href="/client/requests?type=NFC" variant="primary">
          Agregar punto TapGo
        </LinkButton>
      </div>
    </Card>
  );
}
