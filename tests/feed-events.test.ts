import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildFeedEventRows, createFeedEventRow, getSeenPostIdsFromEvents, recordFeedEvent } from "@/lib/feed-events";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("feed exposure and feedback events", () => {
  it("seeds feed exposure events for posts that have been shown", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.feedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ learnerId: demoLearnerId, postId: "evals-after-bug", eventType: "shown" }),
        expect.objectContaining({ learnerId: demoLearnerId, postId: "model-gateway", eventType: "saved" }),
        expect.objectContaining({ learnerId: demoLearnerId, postId: "ai-trace", eventType: "opened" })
      ])
    );
    expect(getSeenPostIdsFromEvents(rows.feedEvents)).toEqual(expect.arrayContaining(["evals-after-bug", "model-gateway", "ai-trace"]));
  });

  it("builds native save/open/hide feedback events without survey payloads", () => {
    const events = buildFeedEventRows([
      { learnerId: demoLearnerId, postId: "model-gateway", eventType: "saved" },
      { learnerId: demoLearnerId, postId: "ai-trace", eventType: "opened" },
      { learnerId: demoLearnerId, postId: "rag-poll", eventType: "hidden" }
    ]);

    expect(events).toEqual([
      expect.objectContaining({ id: "feed-event-norman-model-gateway-saved-0", metadata: { surface: "feed" } }),
      expect.objectContaining({ id: "feed-event-norman-ai-trace-opened-1", metadata: { surface: "feed" } }),
      expect.objectContaining({ id: "feed-event-norman-rag-poll-hidden-2", metadata: { surface: "feed" } })
    ]);
  });

  it("appends timestamped feedback events for server actions", () => {
    const existing = buildFeedEventRows([{ learnerId: demoLearnerId, postId: "model-gateway", eventType: "shown" }]);

    const updated = recordFeedEvent(existing, {
      learnerId: demoLearnerId,
      postId: "model-gateway",
      eventType: "opened",
      occurredAt: new Date("2026-07-09T12:00:00Z")
    });

    expect(updated).toHaveLength(2);
    expect(updated[1]).toMatchObject({
      id: "feed-event-norman-model-gateway-opened-1",
      learnerId: demoLearnerId,
      postId: "model-gateway",
      eventType: "opened",
      occurredAt: new Date("2026-07-09T12:00:00Z")
    });
  });

  it("creates runtime feedback events with UUID-backed ids instead of timestamp-only ids", () => {
    const first = createFeedEventRow(
      { learnerId: demoLearnerId, postId: "model-gateway", eventType: "opened" },
      { idGenerator: () => "11111111-1111-4111-8111-111111111111" }
    );
    const second = createFeedEventRow(
      { learnerId: demoLearnerId, postId: "model-gateway", eventType: "opened" },
      { idGenerator: () => "22222222-2222-4222-8222-222222222222" }
    );

    expect(first.id).toBe("feed-event-norman-model-gateway-opened-11111111-1111-4111-8111-111111111111");
    expect(second.id).toBe("feed-event-norman-model-gateway-opened-22222222-2222-4222-8222-222222222222");
    expect(first.id).not.toBe(second.id);
  });
});
