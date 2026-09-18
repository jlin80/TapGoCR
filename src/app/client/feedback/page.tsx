import type { Metadata } from "next";

import { FeedbackView, type FeedbackPeriod } from "@/components/feedback-view";
import { NoBusinessAssigned } from "@/components/no-business";
import { PageHeader } from "@/components/ui";
import { getClientContext } from "@/lib/client-context";

export const metadata: Metadata = { title: "Feedback y reseñas" };

const VALID_PERIODS: FeedbackPeriod[] = ["7d", "30d", "90d", "all"];

export default async function ClientFeedbackPage({
  searchParams,
}: PageProps<"/client/feedback">) {
  const { business } = await getClientContext();
  const params = await searchParams;

  if (!business) {
    return (
      <>
        <PageHeader title="Feedback y reseñas" />
        <NoBusinessAssigned />
      </>
    );
  }

  const ratingParam = Array.isArray(params.rating) ? params.rating[0] : params.rating;
  const rating = ratingParam ? Number(ratingParam) : undefined;
  const periodParam = Array.isArray(params.period) ? params.period[0] : params.period;
  const period = VALID_PERIODS.includes(periodParam as FeedbackPeriod)
    ? (periodParam as FeedbackPeriod)
    : "30d";

  return (
    <>
      <PageHeader
        title="Feedback y reseñas"
        description="Lo que tus clientes opinan al escanear tu placa, y cuántos hacen clic para publicarlo en Google."
      />
      <FeedbackView
        businessId={business.id}
        basePath="/client/feedback"
        rating={rating && rating >= 1 && rating <= 5 ? rating : undefined}
        period={period}
      />
    </>
  );
}
