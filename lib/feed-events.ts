import type { feedEvents } from "@/lib/db/schema";

export type FeedEventType = "shown" | "opened" | "saved" | "unsaved" | "hidden" | "dismissed" | "revisited";

export type FeedEventInput = {
  learnerId: string;
  postId: string;
  eventType: FeedEventType;
  agenticPostIntentId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

export type FeedEventRow = typeof feedEvents.$inferInsert;

const seenEventTypes = new Set<FeedEventType>(["shown", "opened", "saved", "revisited"]);

function eventId({ learnerId, postId, eventType }: FeedEventInput, index: number) {
  return `feed-event-${learnerId}-${postId}-${eventType}-${index}`;
}

export function buildFeedEventRows(inputs: FeedEventInput[]): FeedEventRow[] {
  return inputs.map((input, index) => ({
    id: eventId(input, index),
    learnerId: input.learnerId,
    postId: input.postId,
    agenticPostIntentId: input.agenticPostIntentId ?? null,
    eventType: input.eventType,
    metadata: input.metadata ?? { surface: "feed" },
    ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
  }));
}

export function recordFeedEvent(existingEvents: FeedEventRow[], input: FeedEventInput): FeedEventRow[] {
  return [...existingEvents, ...buildFeedEventRows([{ ...input, metadata: input.metadata ?? { surface: "feed" } }]).map((event) => ({
    ...event,
    id: eventId(input, existingEvents.length)
  }))];
}

export function getSeenPostIdsFromEvents(events: Pick<FeedEventRow, "postId" | "eventType">[]) {
  return Array.from(new Set(events.filter((event) => seenEventTypes.has(event.eventType)).map((event) => event.postId)));
}
