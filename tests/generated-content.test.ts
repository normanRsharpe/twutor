import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import {
  buildGeneratedContentAdminRows,
  buildGeneratedPostId,
  createGeneratedContentCandidates,
  createGeneratedContentDraft,
  publishGeneratedContentDraft,
  reviewGeneratedContentDraft
} from "@/lib/generated-content";
import { createMockTwutorAIClient } from "@/lib/twutor-ai";

const baseInput = {
  tutor: tutors.maya,
  kind: "diagram" as const,
  theme: "Model gateway launch checklist",
  sourceBriefId: "brief-1",
  briefSummary: "Teach launch checks grounded in reviewed gateway research.",
  aiClient: createMockTwutorAIClient()
};

describe("generated content pipeline", () => {
  it("generates reviewable variants with source brief and audit metadata", async () => {
    let id = 0;
    const drafts = await createGeneratedContentCandidates({ ...baseInput, variantCount: 2, idGenerator: () => `draft-${++id}` });

    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ id: "draft-1", status: "draft", tutorId: "maya", kind: "diagram", sourceBriefId: "brief-1", variantIndex: 0, reviewStatus: "pending" });
    expect(drafts[1]).toMatchObject({ id: "draft-2", variantIndex: 1 });
    expect(drafts[0].prompt).toContain("Teach launch checks grounded in reviewed gateway research");
    expect(drafts[0].metadata).toMatchObject({ mocked: true, promptVersion: "content-draft-v1" });
    expect(buildGeneratedPostId(drafts[0])).not.toBe(buildGeneratedPostId(drafts[1]));
  });

  it("blocks provider failures and unsupported claims from review eligibility", async () => {
    const draft = await createGeneratedContentDraft({
      ...baseInput,
      aiClient: {
        async generateTutorResponse() { throw new Error("not used"); },
        async generateContentDraft() { return { provider: "openai", model: "gpt-5.6-luna", body: "[unsupported] 99% of gateways fail.", metadata: { outcome: "failure", errorCode: "AI_PROVIDER_FAILED" } }; }
      },
      idGenerator: () => "failed-draft"
    });

    const row = buildGeneratedContentAdminRows({ drafts: [draft], tutors, posts })[0];
    expect(row.publishBlocked).toBe(true);
    expect(row.publishErrors).toEqual(expect.arrayContaining(["provider generation did not succeed", "draft contains unsupported claims"]));
    expect(() => reviewGeneratedContentDraft(draft, { decision: "approved", revisionReason: null })).toThrow(/validation/i);
  });

  it("requires explicit approval before publishing and records review outcome", async () => {
    const draft = await createGeneratedContentDraft({ ...baseInput, idGenerator: () => "draft-1" });
    expect(() => publishGeneratedContentDraft(draft, { postId: "generated-model-gateway-launch", sortOrder: 99 })).toThrow(/approved/i);

    const approved = reviewGeneratedContentDraft(draft, { decision: "approved", revisionReason: "Grounded against brief-1" });
    const published = publishGeneratedContentDraft(approved, { postId: "generated-model-gateway-launch", sortOrder: 99 });

    expect(published.draft).toMatchObject({ status: "published", reviewStatus: "approved", revisionReason: "Grounded against brief-1" });
    expect(published.post).toMatchObject({ id: "generated-model-gateway-launch", tutorId: "maya", kind: "diagram", sortOrder: 99 });
  });
});
