import type { Metadata } from "next";

import { AnalyticsView } from "@/components/analytics-view";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { requireRoot } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Analytics" };

/**
 * Analytics globales: se elige un negocio y se reutiliza la misma vista que ve
 * el cliente, para que administración y cliente nunca vean cifras distintas.
 */
export default async function AdminAnalyticsPage({
  searchParams,
}: PageProps<"/app/analytics">) {
  await requireRoot();

  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  if (businesses.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" />
        <EmptyState
          title="Todavía no hay negocios"
          description="Creá un negocio para empezar a ver estadísticas."
        />
      </>
    );
  }

  const params = await searchParams;
  const requested = Array.isArray(params.business) ? params.business[0] : params.business;
  const selected =
    businesses.find((business) => business.id === requested) ?? businesses[0];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Actividad de los últimos 30 días por negocio."
      />

      <Card className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium">Negocio</span>
            <select
              name="business"
              defaultValue={selected.id}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-brand-contrast"
          >
            Ver
          </button>
        </form>
      </Card>

      <AnalyticsView businessId={selected.id} />
    </>
  );
}
