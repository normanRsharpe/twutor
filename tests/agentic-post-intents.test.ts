import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { getAgenticPostIntentPublishErrors, publishAgenticPostIntent } from "@/lib/agentic-post-intents";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("agentic post intents", () => {
  it("seeds learner-aware feed moves beyond strict prerequisite chains", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.agenticPostIntents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          learnerId: demoLearnerId,
          tutorId: "maya",
          status: "planned",
          feedMove: "confidence_boost",
          noveltyLevel: "familiar",
          targetConceptSlugs: ["model-gateways"]
        }),
        expect.objectContaining({
          learnerId: demoLearnerId,
          tutorId: "sam",
          status: "planned",
          feedMove: "leap",
          noveltyLevel: "leap",
          targetConceptSlugs: ["agent-permissions", "tool-safety"]
        }),
        expect.objectContaining({
          learnerId: demoLearnerId,
          tutorId: "theo",
          status: "planned",
          feedMove: "parallel_track",
          noveltyLevel: "adjacent",
          relatedConceptSlugs: ["model-gateways"]
        })
      ])
    );
  });

  it("requires every seeded intent to declare its feed role and landing hypothesis", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.agenticPostIntents.length).toBeGreaterThan(0);
    for (const intent of rows.agenticPostIntents) {
      expect(intent.feedMove).toBeTruthy();
      expect(intent.landingHypothesis.trim().length).toBeGreaterThan(24);
      expect(intent.expectedLearnerEffect.trim().length).toBeGreaterThan(12);
      expect(getAgenticPostIntentPublishErrors(intent, "future-post")).toEqual([]);
    }
  });

  it("blocks publishing intents without the intentionality needed to become feed posts", () => {
    const rows = buildSeedRows({ tutors, posts });
    const intent = rows.agenticPostIntents[0];

    expect(() => publishAgenticPostIntent({ ...intent, landingHypothesis: " " }, "future-post")).toThrow(/landing hypothesis/i);
    expect(() => publishAgenticPostIntent({ ...intent, expectedLearnerEffect: "" }, "future-post")).toThrow(/expected learner effect/i);
    expect(() => publishAgenticPostIntent({ ...intent, expectedSeenProbability: 125 }, "future-post")).toThrow(/expected seen probability/i);
    expect(() => publishAgenticPostIntent(intent, "")).toThrow(/published post id/i);
  });

  it("publishes a complete planned intent by linking it to a feed post", () => {
    const rows = buildSeedRows({ tutors, posts });
    const intent = rows.agenticPostIntents[0];

    expect(publishAgenticPostIntent(intent, "model-gateway")).toMatchObject({
      ...intent,
      status: "published",
      publishedPostId: "model-gateway"
    });
  });
});
