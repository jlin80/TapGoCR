import type { Metadata } from "next";

import { AnalyticsView } from "@/components/analytics-view";
import { NoBusinessAssigned } from "@/components/no-business";
import { PageHeader } from "@/components/ui";
import { getClientContext } from "@/lib/client-context";

export const metadata: Metadata = { title: "Analytics" };

export default async function ClientAnalyticsPage() {
  const { business } = await getClientContext();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Actividad de tus tags en los últimos 30 días."
      />
      {business ? <AnalyticsView businessId={business.id} /> : <NoBusinessAssigned />}
    </>
  );
}
