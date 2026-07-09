export type AgenticPostIntentStatus = "planned" | "published" | "retired";
export type AgenticFeedMove =
  | "bridge"
  | "introduce"
  | "revisit"
  | "deepen"
  | "apply"
  | "confidence_boost"
  | "leap"
  | "parallel_track"
  | "serendipity";
export type AgenticNoveltyLevel = "familiar" | "adjacent" | "stretch" | "leap";

export type PublishableAgenticPostIntent = {
  status?: AgenticPostIntentStatus;
  feedMove?: AgenticFeedMove | null;
  landingHypothesis?: string | null;
  expectedLearnerEffect?: string | null;
  expectedSeenProbability?: number | null;
  expectedSaveProbability?: number | null;
  publishedPostId?: string | null;
};

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function isProbability(value: number | null | undefined) {
  if (typeof value !== "number") return false;
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

export function getAgenticPostIntentPublishErrors(intent: PublishableAgenticPostIntent, publishedPostId = intent.publishedPostId) {
  const errors: string[] = [];

  if (!intent.feedMove) errors.push("feed move is required");
  if (!hasText(intent.landingHypothesis)) errors.push("landing hypothesis is required");
  if (!hasText(intent.expectedLearnerEffect)) errors.push("expected learner effect is required");
  if (!isProbability(intent.expectedSeenProbability)) errors.push("expected seen probability must be an integer from 0 to 100");
  if (!isProbability(intent.expectedSaveProbability)) errors.push("expected save probability must be an integer from 0 to 100");
  if (!hasText(publishedPostId)) errors.push("published post id is required");

  return errors;
}

export function assertAgenticPostIntentReadyForPublishing(intent: PublishableAgenticPostIntent, publishedPostId = intent.publishedPostId) {
  const errors = getAgenticPostIntentPublishErrors(intent, publishedPostId);
  if (errors.length) {
    throw new Error(`Agentic post intent cannot be published: ${errors.join("; ")}`);
  }
}

export function publishAgenticPostIntent<T extends PublishableAgenticPostIntent>(intent: T, publishedPostId: string) {
  assertAgenticPostIntentReadyForPublishing(intent, publishedPostId);
  return {
    ...intent,
    status: "published" as const,
    publishedPostId
  };
}
