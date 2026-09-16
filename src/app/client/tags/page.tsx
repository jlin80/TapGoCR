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

export const metadata: Metadata = { title: "Mis tags" };

export default async function ClientTagsPage() {
  const { business } = await getClientContext();

  if (!business) {
    return (
      <>
        <PageHeader title="Mis tags" />
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
      _count: { select: { events: { where: { eventType: ScanEventType.SCAN } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Mis tags"
        description="Cada tag es una placa o sticker instalado en tu local."
      />

      <QuotaNotice quota={quota} />

      {tags.length === 0 ? (
        <EmptyState
          title="Todavía no tenés tags"
          description="El equipo de TapGoCR los crea y te los entrega listos para instalar."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tags.map((tag) => {
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
                    scans registrados
                  </p>

                  <p className="break-all font-mono text-xs text-muted">{url}</p>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <CopyButton value={url} />
                    <LinkButton href={`/api/tags/${tag.id}/qr`} download>
                      Descargar QR
                    </LinkButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AddTagCard quota={quota} plan={business.plan} />
    </>
  );
}

/**
 * Costo de una placa adicional, siempre visible y nunca escondido.
 *
 * El precio depende de placas, no de taps: acá se dice de frente cuánto cuesta
 * sumar una, si eso cambia la cuota mensual, y con qué plan conviene quedar si
 * la nueva placa te saca de lo incluido.
 */
function AddTagCard({
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
      <h3 className="font-medium">Agregar una placa</h3>
      <p className="mt-1 text-sm text-muted">
        Precio: <span className="font-medium text-foreground">{additionalTagPriceLabel(plan)}</span>.
        No cambia tu cuota mensual por sí sola.
      </p>

      {suggested ? (
        <p className="mt-2 text-sm text-warning">
          Esta placa te saca de las incluidas en tu plan actual. Con el plan{" "}
          {PLAN_LABELS[suggested]} quedarías cubierto.
        </p>
      ) : null}

      <div className="mt-4">
        <LinkButton href="/client/requests?type=NFC" variant="primary">
          Solicitar placa adicional
        </LinkButton>
      </div>
    </Card>
  );
}
