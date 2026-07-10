import { notFound } from "next/navigation";
import { TwutorApp } from "@/components/twutor-app";
import { requireCurrentLearner } from "@/lib/auth/server";
import type { TutorId } from "@/data/twutor";
import { getTutorProfile } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function TutorPage({ params }: { params: Promise<{ id: string }> }) {
  const learner = await requireCurrentLearner();
  const { id } = await params;
  const feedData = await getTutorProfile(id, learner.id);

  if (!feedData) notFound();

  return <TwutorApp feedData={feedData} selectedTutorId={id as TutorId} learnerIdentity={learner} />;
}
