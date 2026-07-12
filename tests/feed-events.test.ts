import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildFeedEventRows, createFeedEventRow, createLearnerFeedbackEvent, getHiddenPostIdsFromEvents, getSeenPostIdsFromEvents, isLearnerFeedbackSignal, recordFeedEvent } from "@/lib/feed-events";
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
      expect.objectContaining({ id: "feed-event-norman-model-gateway-saved-0", metadata: { surface: "feed", stage: "interaction" } }),
      expect.objectContaining({ id: "feed-event-norman-ai-trace-opened-1", metadata: { surface: "feed", stage: "interaction" } }),
      expect.objectContaining({ id: "feed-event-norman-rag-poll-hidden-2", metadata: { surface: "feed", stage: "interaction" } })
    ]);
  });

  it.each([
    ["shown", "impression"],
    ["opened", "interaction"],
    ["saved", "interaction"],
    ["completed", "completion"]
  ] as const)("classifies %s events as %s instrumentation", (eventType, stage) => {
    const event = createFeedEventRow(
      { learnerId: demoLearnerId, postId: "model-gateway", eventType },
      { idGenerator: () => "stage" }
    );

    expect(event.metadata).toMatchObject({ surface: "feed", stage });
  });

  it("identifies posts hidden or dismissed by the learner", () => {
    const events = buildFeedEventRows([
      { learnerId: demoLearnerId, postId: "keep", eventType: "shown" },
      { learnerId: demoLearnerId, postId: "hide", eventType: "hidden" },
      { learnerId: demoLearnerId, postId: "dismiss", eventType: "dismissed" }
    ]);

    expect(getHiddenPostIdsFromEvents(events)).toEqual(["hide", "dismiss"]);
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

  it("accepts only supported explicit feedback signals", () => {
    expect(isLearnerFeedbackSignal("more_like_this")).toBe(true);
    expect(isLearnerFeedbackSignal("need_an_example")).toBe(true);
    expect(isLearnerFeedbackSignal("survey_answer")).toBe(false);
    expect(isLearnerFeedbackSignal(null)).toBe(false);
  });

  it.each([
    ["more_like_this", false],
    ["less_like_this", true],
    ["too_advanced", true],
    ["need_an_example", false]
  ] as const)("records %s as explicit feedback without conflating it with a native interaction", (signal, suppressesPost) => {
    const event = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal },
      { idGenerator: () => "feedback-id" }
    );

    expect(event).toMatchObject({
      learnerId: "learner-a",
      postId: "post-1",
      eventType: "feedback",
      metadata: { surface: "feed", feedbackSignal: signal, suppressesPost }
    });
  });

  it("uses the latest explicit signal so a learner can reverse feed suppression", () => {
    const lessLikeThis = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal: "less_like_this" },
      { idGenerator: () => "less-like-this" }
    );
    const reversed = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal: "more_like_this" },
      { idGenerator: () => "more-like-this" }
    );

    expect(getHiddenPostIdsFromEvents([lessLikeThis])).toEqual(["post-1"]);
    expect(getHiddenPostIdsFromEvents([lessLikeThis, reversed])).toEqual([]);
  });

  it("isolates suppression signals to the authenticated learner", () => {
    const learnerA = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal: "less_like_this" },
      { idGenerator: () => "learner-a" }
    );
    const learnerB = createLearnerFeedbackEvent(
      { learnerId: "learner-b", postId: "post-2", signal: "too_advanced" },
      { idGenerator: () => "learner-b" }
    );

    expect(getHiddenPostIdsFromEvents([learnerA, learnerB], "learner-a")).toEqual(["post-1"]);
    expect(getHiddenPostIdsFromEvents([learnerA, learnerB], "learner-b")).toEqual(["post-2"]);
  });

  it("uses event time rather than query order when reversing feedback", () => {
    const suppressed = createLearnerFeedbackEvent({
      learnerId: "learner-a",
      postId: "post-1",
      signal: "less_like_this"
    });
    const reversed = createLearnerFeedbackEvent({
      learnerId: "learner-a",
      postId: "post-1",
      signal: "more_like_this"
    });
    suppressed.occurredAt = new Date("2026-07-12T10:00:00Z");
    reversed.occurredAt = new Date("2026-07-12T10:01:00Z");

    expect(getHiddenPostIdsFromEvents([reversed, suppressed], "learner-a")).toEqual([]);
  });

  it("uses event ids to resolve feedback recorded at the same time", () => {
    const occurredAt = new Date("2026-07-12T10:00:00Z");
    const suppressed = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal: "less_like_this" },
      { idGenerator: () => "0001" }
    );
    const reversed = createLearnerFeedbackEvent(
      { learnerId: "learner-a", postId: "post-1", signal: "more_like_this" },
      { idGenerator: () => "0002" }
    );
    suppressed.occurredAt = occurredAt;
    reversed.occurredAt = occurredAt;

    expect(getHiddenPostIdsFromEvents([reversed, suppressed], "learner-a")).toEqual([]);
  });
});
