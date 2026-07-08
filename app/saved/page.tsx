import { TwutorApp } from "@/components/twutor-app";
import { getFeedData } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const feedData = await getFeedData({ feed: "saved" });
  return <TwutorApp feedData={feedData} mode="saved" />;
}
