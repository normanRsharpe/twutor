import { TwutorApp } from "@/components/twutor-app";
import { getFeedData } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function TutorsPage() {
  const feedData = await getFeedData();
  return <TwutorApp feedData={feedData} mode="tutors" />;
}
