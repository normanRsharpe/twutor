import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("content briefs and research notes", () => {
  it("seeds learner-aware briefs with strategy fields needed before drafting posts", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.contentBriefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "brief-agentic-feed-foundation",
          learnerId: demoLearnerId,
          status: "active",
          theme: "Agentic feed ops foundation",
          targetConceptSlugs: ["agent-workflows", "agent-permissions", "inference-cost"],
          revisitConceptSlugs: ["vector-databases"],
          avoidConceptSlugs: ["multi-agent-framework-shopping"]
        })
      ])
    );

    const brief = rows.contentBriefs.find((candidate) => candidate.id === "brief-agentic-feed-foundation");
    expect(brief?.objective).toMatch(/feed-native/i);
    expect(brief?.desiredPostMix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feedMove: "confidence_boost", count: 1 }),
        expect.objectContaining({ feedMove: "leap", count: 1 }),
        expect.objectContaining({ feedMove: "parallel_track", count: 1 }),
        expect.objectContaining({ feedMove: "revisit", count: 1 })
      ])
    );
  });

  it("preserves compressed research notes with claims for citation and review", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.researchNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "note-agent-workflows-boundaries",
          contentBriefId: "brief-agentic-feed-foundation",
          sourceTitle: "Agent workflows need explicit tool boundaries",
          relatedConceptSlugs: ["agent-workflows", "agent-permissions"]
        }),
        expect.objectContaining({
          id: "note-vector-retrieval-quality",
          contentBriefId: "brief-agentic-feed-foundation",
          sourceTitle: "Retrieval quality beats vector database theater",
          relatedConceptSlugs: ["vector-databases", "rag-citations"]
        })
      ])
    );

    for (const note of rows.researchNotes) {
      expect(note.summary.trim().length).toBeGreaterThan(32);
      expect(note.claims.length).toBeGreaterThan(0);
      expect(note.reviewNotes.trim().length).toBeGreaterThan(16);
    }
  });

  it("lets post intents trace back to the brief that shaped them", () => {
    const rows = buildSeedRows({ tutors, posts });
    const briefIds = new Set(rows.contentBriefs.map((brief) => brief.id));

    expect(rows.agenticPostIntents.length).toBeGreaterThan(0);
    for (const intent of rows.agenticPostIntents) {
      expect(intent.contentBriefId).toBeTruthy();
      expect(briefIds.has(intent.contentBriefId!)).toBe(true);
    }
  });
});
