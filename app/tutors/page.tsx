import { TwutorApp } from "@/components/twutor-app";
import { requireCurrentLearner } from "@/lib/auth/server";
import { getFeedData } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function TutorsPage() {
  const learner = await requireCurrentLearner();
  const feedData = await getFeedData();
  return <TwutorApp feedData={feedData} mode="tutors" learnerIdentity={learner} />;
}
