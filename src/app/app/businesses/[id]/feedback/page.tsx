import type { Metadata } from "next";

import { FeedbackView, type FeedbackPeriod } from "@/components/feedback-view";
import { requireBusinessAccess } from "@/lib/authz";

export const metadata: Metadata = { title: "Feedback del negocio" };

const VALID_PERIODS: FeedbackPeriod[] = ["7d", "30d", "90d", "all"];

export default async function BusinessFeedbackPage({
  params,
  searchParams,
}: PageProps<"/app/businesses/[id]/feedback">) {
  const { id } = await params;
  await requireBusinessAccess(id);
  const query = await searchParams;

  const ratingParam = Array.isArray(query.rating) ? query.rating[0] : query.rating;
  const rating = ratingParam ? Number(ratingParam) : undefined;
  const periodParam = Array.isArray(query.period) ? query.period[0] : query.period;
  const period = VALID_PERIODS.includes(periodParam as FeedbackPeriod)
    ? (periodParam as FeedbackPeriod)
    : "30d";

  return (
    <FeedbackView
      businessId={id}
      basePath={`/app/businesses/${id}/feedback`}
      rating={rating && rating >= 1 && rating <= 5 ? rating : undefined}
      period={period}
    />
  );
}
