import { randomUUID } from "node:crypto";
import type { feedEvents } from "@/lib/db/schema";

export type FeedEventType = "shown" | "opened" | "saved" | "unsaved" | "hidden" | "dismissed" | "revisited" | "feedback";

export type LearnerFeedbackSignal = "more_like_this" | "less_like_this" | "too_advanced" | "need_an_example";

const learnerFeedbackSignals = new Set<LearnerFeedbackSignal>(["more_like_this", "less_like_this", "too_advanced", "need_an_example"]);

export function isLearnerFeedbackSignal(value: unknown): value is LearnerFeedbackSignal {
  return typeof value === "string" && learnerFeedbackSignals.has(value as LearnerFeedbackSignal);
}

export type LearnerFeedbackInput = {
  learnerId: string;
  postId: string;
  signal: LearnerFeedbackSignal;
};

export type FeedEventInput = {
  learnerId: string;
  postId: string;
  eventType: FeedEventType;
  agenticPostIntentId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

export type FeedEventRow = typeof feedEvents.$inferInsert;

export type RuntimeFeedEventOptions = {
  idGenerator?: () => string;
};

let runtimeEventSequence = 0;

function runtimeEventSuffix() {
  runtimeEventSequence += 1;
  return `${Date.now().toString().padStart(13, "0")}-${runtimeEventSequence.toString().padStart(8, "0")}-${randomUUID()}`;
}

const seenEventTypes = new Set<FeedEventType>(["shown", "opened", "saved", "revisited"]);

function eventId({ learnerId, postId, eventType }: FeedEventInput, suffix: number | string) {
  return `feed-event-${learnerId}-${postId}-${eventType}-${suffix}`;
}

function feedEventRow(input: FeedEventInput, id: string): FeedEventRow {
  return {
    id,
    learnerId: input.learnerId,
    postId: input.postId,
    agenticPostIntentId: input.agenticPostIntentId ?? null,
    eventType: input.eventType,
    metadata: input.metadata ?? { surface: "feed" },
    ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
  };
}

export function buildFeedEventRows(inputs: FeedEventInput[]): FeedEventRow[] {
  return inputs.map((input, index) => feedEventRow(input, eventId(input, index)));
}

export function createFeedEventRow(input: FeedEventInput, options: RuntimeFeedEventOptions = {}): FeedEventRow {
  return feedEventRow(input, eventId(input, options.idGenerator?.() ?? runtimeEventSuffix()));
}

export function createLearnerFeedbackEvent(input: LearnerFeedbackInput, options: RuntimeFeedEventOptions = {}): FeedEventRow {
  const suppressesPost = input.signal === "less_like_this" || input.signal === "too_advanced";
  return createFeedEventRow(
    {
      learnerId: input.learnerId,
      postId: input.postId,
      eventType: "feedback",
      metadata: { surface: "feed", feedbackSignal: input.signal, suppressesPost }
    },
    options
  );
}

export function recordFeedEvent(existingEvents: FeedEventRow[], input: FeedEventInput): FeedEventRow[] {
  return [...existingEvents, feedEventRow({ ...input, metadata: input.metadata ?? { surface: "feed" } }, eventId(input, existingEvents.length))];
}

export function getSeenPostIdsFromEvents(events: Pick<FeedEventRow, "postId" | "eventType">[]) {
  return Array.from(new Set(events.filter((event) => seenEventTypes.has(event.eventType)).map((event) => event.postId)));
}

export function getHiddenPostIdsFromEvents(
  events: Pick<FeedEventRow, "id" | "learnerId" | "postId" | "eventType" | "metadata" | "occurredAt">[],
  learnerId?: string
) {
  const hiddenPostIds = new Set<string>();
  const explicitlySuppressed = new Map<string, boolean>();

  for (const event of events) {
    if (learnerId && event.learnerId !== learnerId) continue;
    if (event.eventType === "hidden" || event.eventType === "dismissed") hiddenPostIds.add(event.postId);
  }

  const chronologicalFeedbackEvents = events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.eventType === "feedback" && (!learnerId || event.learnerId === learnerId))
    .sort((left, right) => {
      const timeDifference = (left.event.occurredAt?.getTime() ?? 0) - (right.event.occurredAt?.getTime() ?? 0);
      return timeDifference || left.event.id.localeCompare(right.event.id) || left.index - right.index;
    });

  for (const { event } of chronologicalFeedbackEvents) {
    if (event.metadata && typeof event.metadata === "object" && "suppressesPost" in event.metadata) {
      explicitlySuppressed.set(event.postId, event.metadata.suppressesPost === true);
    }
  }

  for (const [postId, suppressed] of explicitlySuppressed) {
    if (suppressed) hiddenPostIds.add(postId);
  }

  return Array.from(hiddenPostIds);
}
