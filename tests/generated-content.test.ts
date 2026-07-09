import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import {
  buildGeneratedContentAdminRows,
  createGeneratedContentDraft,
  publishGeneratedContentDraft
} from "@/lib/generated-content";
import { createMockTwutorAIClient } from "@/lib/twutor-ai";

describe("generated content pipeline", () => {
  it("generates a reviewable draft with mocked OpenAI prompt metadata and publishes it into feed rows", async () => {
    const draft = await createGeneratedContentDraft({
      tutor: tutors.maya,
      kind: "diagram",
      theme: "Model gateway launch checklist",
      aiClient: createMockTwutorAIClient(),
      idGenerator: () => "draft-1"
    });

    expect(draft).toMatchObject({
      id: "draft-1",
      status: "draft",
      tutorId: "maya",
      kind: "diagram",
      theme: "Model gateway launch checklist",
      provider: "mock-openai",
      model: "gpt-4.1-mini-mock"
    });
    expect(draft.prompt).toContain("Model gateway launch checklist");
    expect(draft.metadata).toMatchObject({ mocked: true, kind: "diagram", tutorId: "maya" });

    const adminRows = buildGeneratedContentAdminRows({ drafts: [draft], tutors, posts });
    expect(adminRows[0]).toMatchObject({ id: "draft-1", tutorName: "Maya Chen", status: "draft", publishBlocked: false });

    const published = publishGeneratedContentDraft(draft, { postId: "generated-model-gateway-launch", sortOrder: 99 });

    expect(published.draft).toMatchObject({ status: "published", publishedPostId: "generated-model-gateway-launch" });
    expect(published.post).toMatchObject({
      id: "generated-model-gateway-launch",
      tutorId: "maya",
      kind: "diagram",
      body: expect.stringContaining("Model gateway launch checklist"),
      sortOrder: 99
    });
  });
});
