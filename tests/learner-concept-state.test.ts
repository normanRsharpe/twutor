import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("learner concept state", () => {
  it("seeds concept familiarity across the full learning spectrum", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.conceptStates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ learnerId: demoLearnerId, conceptSlug: "agent-workflows", familiarity: "unknown" }),
        expect.objectContaining({ learnerId: demoLearnerId, conceptSlug: "rag-citations", familiarity: "seen" }),
        expect.objectContaining({ learnerId: demoLearnerId, conceptSlug: "ai-observability", familiarity: "familiar" }),
        expect.objectContaining({ learnerId: demoLearnerId, conceptSlug: "model-gateways", familiarity: "confident" }),
        expect.objectContaining({ learnerId: demoLearnerId, conceptSlug: "vector-databases", familiarity: "stale" })
      ])
    );
  });

  it("stores revisit and confidence signals for curation", () => {
    const rows = buildSeedRows({ tutors, posts });
    const staleConcept = rows.conceptStates.find((concept) => concept.conceptSlug === "vector-databases");

    expect(staleConcept).toMatchObject({
      learnerId: demoLearnerId,
      label: "Vector databases",
      confidence: 48,
      evidence: "Previously saved RAG material but has not revisited retrieval tradeoffs recently",
      nextAction: "revisit"
    });
  });
});
