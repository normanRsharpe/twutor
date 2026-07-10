import { redirect } from "next/navigation";
import { TwutorApp } from "@/components/twutor-app";
import { canRunDevelopmentReset } from "@/lib/admin-security";
import { requireCurrentLearner } from "@/lib/auth/server";
import { resetFallbackAskTutorThreads } from "@/lib/ask-tutor-queries";
import { getFeedData, type FeedKind } from "@/lib/feed-queries";
import { resetFallbackGeneratedContentState } from "@/lib/generated-content-queries";
import { resetFallbackLearnerMemoryState } from "@/lib/learner-memory";
import { getLearnerOnboarding } from "@/lib/onboarding-queries";
import { resetFallbackSocialTextureState } from "@/lib/social-texture-queries";

export const dynamic = "force-dynamic";

function parseFeed(value: string | string[] | undefined): FeedKind {
  if (value === "following") return "following";
  if (value === "saved") return "saved";
  return "for-you";
}

function isEnabled(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized === "1" || normalized === "true";
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ feed?: string | string[]; reset?: string | string[] }> }) {
  const currentLearner = await requireCurrentLearner();
  if (!(await getLearnerOnboarding(currentLearner.id))) redirect("/onboarding");
  const params = await searchParams;
  if (canRunDevelopmentReset({ nodeEnv: process.env.NODE_ENV, enabled: process.env.TWUTOR_DEV_RESET_ENABLED }) && isEnabled(params.reset)) {
    resetFallbackLearnerMemoryState();
    resetFallbackAskTutorThreads();
    resetFallbackGeneratedContentState();
    resetFallbackSocialTextureState();
  }
  const feedData = await getFeedData({ learnerId: currentLearner.id, feed: parseFeed(params.feed) });
  return <TwutorApp feedData={feedData} learnerIdentity={currentLearner} />;
}
