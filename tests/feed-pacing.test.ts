import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildFeedPacingInventory, getUnseenRatio, planFeedPacing } from "@/lib/feed-pacing";
import { buildSeedRows } from "@/lib/seed-data";

describe("feed pacing simulator", () => {
  function seedPlanInput() {
    const rows = buildSeedRows({ tutors, posts });
    const brief = rows.contentBriefs[0];
    const inventory = buildFeedPacingInventory({
      posts: rows.posts,
      intents: rows.agenticPostIntents,
      seenPostIds: new Set(rows.posts.map((post) => post.id)),
      seenIntentIds: new Set(["intent-maya-gateway-confidence", "intent-nora-vector-revisit", "intent-theo-inference-parallel"])
    });

    return { rows, brief, inventory };
  }

  it("caps unseen inventory at no more than 20 percent of the feed plan", () => {
    const { rows, brief, inventory } = seedPlanInput();

    const plan = planFeedPacing({
      inventory,
      conceptStates: rows.conceptStates,
      followedTutorIds: new Set(rows.follows.map((follow) => follow.tutorId)),
      desiredPostMix: brief.desiredPostMix,
      feedSize: 5
    });

    expect(plan.items).toHaveLength(5);
    expect(plan.unseenCount).toBeLessThanOrEqual(1);
    expect(plan.unseenRatio).toBeLessThanOrEqual(0.2);
    expect(getUnseenRatio(plan.items)).toBe(plan.unseenRatio);
  });

  it("balances confidence boosts, revisits, and one bounded leap when the mix asks for them", () => {
    const { rows, brief, inventory } = seedPlanInput();

    const plan = planFeedPacing({
      inventory,
      conceptStates: rows.conceptStates,
      followedTutorIds: new Set(rows.follows.map((follow) => follow.tutorId)),
      desiredPostMix: brief.desiredPostMix,
      feedSize: 5
    });

    expect(plan.items.map((item) => item.id)).toEqual(
      expect.arrayContaining(["intent-maya-gateway-confidence", "intent-nora-vector-revisit", "intent-sam-agent-permission-leap"])
    );
    expect(plan.items.filter((item) => item.feedMove === "leap")).toHaveLength(1);
    expect(plan.items.filter((item) => item.feedMove === "confidence_boost")).toHaveLength(1);
    expect(plan.items.filter((item) => item.feedMove === "revisit")).toHaveLength(1);
  });

  it("scores stale concepts toward revisit moves and confident concepts toward confidence boosts", () => {
    const { rows, inventory } = seedPlanInput();

    const scored = planFeedPacing({
      inventory,
      conceptStates: rows.conceptStates,
      followedTutorIds: new Set(rows.follows.map((follow) => follow.tutorId)),
      desiredPostMix: [],
      feedSize: 4
    });

    const confidenceBoost = scored.items.find((item) => item.id === "intent-maya-gateway-confidence");
    const revisit = scored.items.find((item) => item.id === "intent-nora-vector-revisit");

    expect(confidenceBoost?.scoreReasons).toContain("confidence boost on confident concept");
    expect(revisit?.scoreReasons).toContain("revisit stale concept");
  });
});
