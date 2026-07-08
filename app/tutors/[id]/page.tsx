import { notFound } from "next/navigation";
import { TwutorApp } from "@/components/twutor-app";
import type { TutorId } from "@/data/twutor";
import { getTutorProfile } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function TutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedData = await getTutorProfile(id);

  if (!feedData) notFound();

  return <TwutorApp feedData={feedData} selectedTutorId={id as TutorId} />;
}
