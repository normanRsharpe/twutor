import type { PublishableAgenticPostIntent } from "@/lib/agentic-post-intents";
import { getAgenticPostIntentPublishErrors } from "@/lib/agentic-post-intents";
import type { SeedRows } from "@/lib/seed-data";

export type AgenticIntentAdminStatus = "planned" | "published" | "retired";
export type AgenticIntentAdminAction = "publish" | "retire";

export type AgenticIntentAdminRow = {
  id: string;
  status: AgenticIntentAdminStatus;
  tutorId: string;
  tutorName: string;
  tutorHandle: string;
  tutorAvatarUrl: string;
  briefTheme: string;
  contentBriefId: string | null;
  feedMove: string;
  noveltyLevel: string;
  suggestedPostKind: string;
  targetConceptSlugs: string[];
  relatedConceptSlugs: string[];
  landingHypothesis: string;
  expectedLearnerEffect: string;
  expectedSeenProbability: number;
  expectedSaveProbability: number;
  voiceNotes: string;
  riskNotes: string;
  publishedPostId: string | null;
  publishedPostLabel: string | null;
  signalCounts: Record<string, number>;
  publishBlocked: boolean;
  publishErrors: string[];
};

export type AgenticIntentStatusCounts = Record<AgenticIntentAdminStatus, number>;

export type AdminEnvironment = Partial<Pick<NodeJS.ProcessEnv, "NODE_ENV" | "TWUTOR_ENABLE_ADMIN_INTENTS">>;

function countEvents(events: SeedRows["feedEvents"]) {
  return events.reduce<Record<string, Record<string, number>>>((acc, event) => {
    acc[event.postId] ??= {};
    acc[event.postId][event.eventType] = (acc[event.postId][event.eventType] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildAgenticIntentAdminRows(rows: Pick<SeedRows, "agenticPostIntents" | "tutors" | "contentBriefs" | "posts" | "feedEvents">): AgenticIntentAdminRow[] {
  const tutorsById = new Map(rows.tutors.map((tutor) => [tutor.id, tutor]));
  const briefsById = new Map(rows.contentBriefs.map((brief) => [brief.id, brief]));
  const postsById = new Map(rows.posts.map((post) => [post.id, post]));
  const signalsByPostId = countEvents(rows.feedEvents);

  return [...rows.agenticPostIntents]
    .sort((a, b) => `${a.status}:${a.id}`.localeCompare(`${b.status}:${b.id}`))
    .map((intent) => {
      const status = intent.status ?? "planned";
      const tutor = tutorsById.get(intent.tutorId);
      const brief = intent.contentBriefId ? briefsById.get(intent.contentBriefId) : undefined;
      const publishedPost = intent.publishedPostId ? postsById.get(intent.publishedPostId) : undefined;
      const publishErrors = getAgenticPostIntentPublishErrors(intent as PublishableAgenticPostIntent, intent.publishedPostId ?? undefined);

      return {
        id: intent.id,
        status,
        tutorId: intent.tutorId,
        tutorName: tutor?.name ?? intent.tutorId,
        tutorHandle: tutor?.handle ?? `@${intent.tutorId}`,
        tutorAvatarUrl: tutor?.avatarUrl ?? "",
        briefTheme: brief?.theme ?? "Unlinked brief",
        contentBriefId: intent.contentBriefId ?? null,
        feedMove: intent.feedMove,
        noveltyLevel: intent.noveltyLevel,
        suggestedPostKind: intent.suggestedPostKind,
        targetConceptSlugs: intent.targetConceptSlugs,
        relatedConceptSlugs: intent.relatedConceptSlugs,
        landingHypothesis: intent.landingHypothesis,
        expectedLearnerEffect: intent.expectedLearnerEffect,
        expectedSeenProbability: intent.expectedSeenProbability,
        expectedSaveProbability: intent.expectedSaveProbability,
        voiceNotes: intent.voiceNotes,
        riskNotes: intent.riskNotes,
        publishedPostId: intent.publishedPostId ?? null,
        publishedPostLabel: publishedPost?.body.slice(0, 96) ?? null,
        signalCounts: intent.publishedPostId ? signalsByPostId[intent.publishedPostId] ?? {} : {},
        publishBlocked: publishErrors.length > 0,
        publishErrors
      };
    });
}

export function getAgenticIntentStatusCounts(rows: Pick<AgenticIntentAdminRow, "status">[]): AgenticIntentStatusCounts {
  return rows.reduce<AgenticIntentStatusCounts>(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { planned: 0, published: 0, retired: 0 }
  );
}

export function getAgenticIntentTransitionErrors(intent: PublishableAgenticPostIntent, action: AgenticIntentAdminAction, publishedPostId?: string | null) {
  if (action === "retire") return [];
  if (intent.status === "retired") return ["retired intents cannot be published"];
  if (intent.status === "published") return ["published intents cannot be published again"];
  return getAgenticPostIntentPublishErrors(intent, publishedPostId ?? intent.publishedPostId);
}

export function isAgenticIntentsAdminEnabled(env: AdminEnvironment = process.env) {
  return env.TWUTOR_ENABLE_ADMIN_INTENTS === "true" || env.NODE_ENV !== "production";
}
