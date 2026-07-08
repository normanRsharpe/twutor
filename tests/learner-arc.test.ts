import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { assembleLearningArc } from "@/lib/feed-queries";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("persistent learner arc state", () => {
  it("seeds a compact learning arc for the demo learner", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.learningStates).toEqual([
      expect.objectContaining({
        learnerId: demoLearnerId,
        currentArc: "AI systems as platform problems",
        progressPercent: 42,
        lastSignal: "Saved model gateway + eval release gates"
      })
    ]);
    expect(rows.learningStates[0].focusTopics).toEqual(["model gateways", "evals", "AI observability"]);
  });

  it("assembles the right-rail learner arc from persisted state and saved count", () => {
    const rows = buildSeedRows({ tutors, posts });
    const arc = assembleLearningArc(rows.learningStates[0], rows.savedPosts.length);

    expect(arc).toEqual({
      title: "Platform × AI Engineering",
      currentArc: "AI systems as platform problems",
      progressPercent: 42,
      savedPostCount: 2,
      focusTopics: ["model gateways", "evals", "AI observability"],
      lastSignal: "Saved model gateway + eval release gates"
    });
  });
});
