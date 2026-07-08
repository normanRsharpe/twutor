import { TwutorApp } from "@/components/twutor-app";
import { getFeedData, type FeedKind } from "@/lib/feed-queries";

export const dynamic = "force-dynamic";

function parseFeed(value: string | string[] | undefined): FeedKind {
  return value === "following" ? "following" : "for-you";
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ feed?: string | string[] }> }) {
  const params = await searchParams;
  const feedData = await getFeedData({ feed: parseFeed(params.feed) });
  return <TwutorApp feedData={feedData} />;
}
