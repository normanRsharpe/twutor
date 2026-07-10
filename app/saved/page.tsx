import { TwutorApp } from "@/components/twutor-app";
import { requireCurrentLearner } from "@/lib/auth/server";
import { getFeedData } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const learner = await requireCurrentLearner();
  const feedData = await getFeedData({ feed: "saved" });
  return <TwutorApp feedData={feedData} mode="saved" learnerIdentity={learner} />;
}
