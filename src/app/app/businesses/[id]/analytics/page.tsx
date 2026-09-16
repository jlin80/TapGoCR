import type { Metadata } from "next";

import { AnalyticsView } from "@/components/analytics-view";
import { requireBusinessAccess } from "@/lib/authz";

export const metadata: Metadata = { title: "Analytics del negocio" };

export default async function BusinessAnalyticsPage({
  params,
}: PageProps<"/app/businesses/[id]/analytics">) {
  const { id } = await params;
  await requireBusinessAccess(id);

  return <AnalyticsView businessId={id} />;
}
