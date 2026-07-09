import type { TutorId } from "@/data/twutor";
import type { AgenticFeedMove, AgenticNoveltyLevel } from "@/lib/agentic-post-intents";
import type { PostKind, SeedRows } from "@/lib/seed-data";

export type FeedPacingSource = "post" | "intent";

export type FeedPacingInventoryItem = {
  id: string;
  source: FeedPacingSource;
  tutorId: string;
  seen: boolean;
  feedMove?: AgenticFeedMove;
  noveltyLevel?: AgenticNoveltyLevel;
  targetConceptSlugs: string[];
  relatedConceptSlugs: string[];
  expectedSeenProbability?: number;
  expectedSaveProbability?: number;
  suggestedPostKind?: PostKind;
  publishedPostId?: string | null;
};

export type ScoredFeedPacingItem = FeedPacingInventoryItem & {
  score: number;
  scoreReasons: string[];
};

export type DesiredPostMixEntry = {
  feedMove: string;
  count: number;
  rationale?: string;
};

export type FeedPacingPlan = {
  items: ScoredFeedPacingItem[];
  unseenCount: number;
  unseenRatio: number;
  maxUnseenCount: number;
};

type ConceptState = SeedRows["conceptStates"][number];

function isConceptState(concept: ConceptState | undefined): concept is ConceptState {
  return concept !== undefined;
}

export function buildFeedPacingInventory({
  posts,
  intents,
  seenPostIds = new Set<string>(),
  seenIntentIds = new Set<string>()
}: {
  posts: Pick<SeedRows["posts"][number], "id" | "tutorId" | "kind">[];
  intents: Pick<
    SeedRows["agenticPostIntents"][number],
    | "id"
    | "tutorId"
    | "feedMove"
    | "noveltyLevel"
    | "targetConceptSlugs"
    | "relatedConceptSlugs"
    | "expectedSeenProbability"
    | "expectedSaveProbability"
    | "suggestedPostKind"
    | "publishedPostId"
  >[];
  seenPostIds?: Set<string>;
  seenIntentIds?: Set<string>;
}): FeedPacingInventoryItem[] {
  return [
    ...posts.map((post) => ({
      id: post.id,
      source: "post" as const,
      tutorId: post.tutorId,
      seen: seenPostIds.has(post.id),
      targetConceptSlugs: [],
      relatedConceptSlugs: [],
      suggestedPostKind: post.kind
    })),
    ...intents.map((intent) => ({
      id: intent.id,
      source: "intent" as const,
      tutorId: intent.tutorId,
      seen: seenIntentIds.has(intent.id),
      feedMove: intent.feedMove,
      noveltyLevel: intent.noveltyLevel,
      targetConceptSlugs: intent.targetConceptSlugs,
      relatedConceptSlugs: intent.relatedConceptSlugs,
      expectedSeenProbability: intent.expectedSeenProbability,
      expectedSaveProbability: intent.expectedSaveProbability,
      suggestedPostKind: intent.suggestedPostKind,
      publishedPostId: intent.publishedPostId
    }))
  ];
}

export function getUnseenRatio(items: Pick<FeedPacingInventoryItem, "seen">[]) {
  if (!items.length) return 0;
  return items.filter((item) => !item.seen).length / items.length;
}

function desiredMoveCounts(desiredPostMix: DesiredPostMixEntry[]) {
  return desiredPostMix.reduce<Record<string, number>>((counts, entry) => {
    if (entry.count > 0) counts[entry.feedMove] = (counts[entry.feedMove] ?? 0) + entry.count;
    return counts;
  }, {});
}

function scoreItem({
  item,
  conceptStates,
  followedTutorIds,
  desiredMoves
}: {
  item: FeedPacingInventoryItem;
  conceptStates: SeedRows["conceptStates"];
  followedTutorIds: Set<string>;
  desiredMoves: Record<string, number>;
}): ScoredFeedPacingItem {
  const conceptBySlug = new Map(conceptStates.map((concept) => [concept.conceptSlug, concept]));
  const scoreReasons: string[] = [];
  let score = item.source === "intent" ? 20 : 8;

  if (item.seen) {
    score += 12;
    scoreReasons.push("seen inventory keeps pacing grounded");
  }

  if (followedTutorIds.has(item.tutorId)) {
    score += 8;
    scoreReasons.push("followed tutor");
  }

  if (item.feedMove && desiredMoves[item.feedMove]) {
    score += 45;
    scoreReasons.push("matches desired post mix");
  }

  if (item.expectedSeenProbability !== undefined) score += item.expectedSeenProbability / 12;
  if (item.expectedSaveProbability !== undefined) score += item.expectedSaveProbability / 15;

  const targetConcepts = item.targetConceptSlugs.map((slug) => conceptBySlug.get(slug)).filter(isConceptState);
  const relatedConcepts = item.relatedConceptSlugs.map((slug) => conceptBySlug.get(slug)).filter(isConceptState);

  if (item.feedMove === "confidence_boost" && targetConcepts.some((concept) => concept.familiarity === "confident")) {
    score += 38;
    scoreReasons.push("confidence boost on confident concept");
  }

  if (item.feedMove === "revisit" && targetConcepts.some((concept) => concept.familiarity === "stale" || concept.nextAction === "revisit")) {
    score += 40;
    scoreReasons.push("revisit stale concept");
  }

  if (item.feedMove === "introduce" && targetConcepts.some((concept) => concept.familiarity === "unknown" || concept.nextAction === "introduce")) {
    score += 28;
    scoreReasons.push("introduce unknown concept");
  }

  if (item.feedMove === "parallel_track" && relatedConcepts.some((concept) => concept.familiarity === "confident")) {
    score += 24;
    scoreReasons.push("parallel track beside confident concept");
  }

  if (item.feedMove === "leap") {
    score += 10;
    scoreReasons.push("bounded leap adds serendipity");
  }

  if (item.noveltyLevel === "leap" && !item.seen) score -= 8;

  return { ...item, score, scoreReasons };
}

export function planFeedPacing({
  inventory,
  conceptStates,
  followedTutorIds = new Set<TutorId>(),
  desiredPostMix = [],
  feedSize,
  maxUnseenRatio = 0.2
}: {
  inventory: FeedPacingInventoryItem[];
  conceptStates: SeedRows["conceptStates"];
  followedTutorIds?: Set<string>;
  desiredPostMix?: DesiredPostMixEntry[];
  feedSize: number;
  maxUnseenRatio?: number;
}): FeedPacingPlan {
  const maxUnseenCount = Math.floor(feedSize * maxUnseenRatio);
  const desiredMoves = desiredMoveCounts(desiredPostMix);
  const scored = inventory
    .map((item) => scoreItem({ item, conceptStates, followedTutorIds, desiredMoves }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const selected: ScoredFeedPacingItem[] = [];
  let unseenCount = 0;

  for (const item of scored) {
    if (selected.length >= feedSize) break;
    if (!item.seen && unseenCount >= maxUnseenCount) continue;
    selected.push(item);
    if (!item.seen) unseenCount += 1;
  }

  return {
    items: selected,
    unseenCount,
    unseenRatio: getUnseenRatio(selected),
    maxUnseenCount
  };
}
