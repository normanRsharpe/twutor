import { describe, expect, it } from "vitest";
import { tutors } from "@/data/twutor";
import { createAskTutorThread, getTutorResponseLabel, getTutorResponseMetadataSummary } from "@/lib/ask-tutors";
import { createMockTwutorAIClient } from "@/lib/twutor-ai";
import { demoLearnerId } from "@/lib/seed-data";

describe("Ask Tutors", () => {
  it("turns a learner question into a guarded tutor response draft using mocked OpenAI", async () => {
    const thread = await createAskTutorThread({
      learnerId: demoLearnerId,
      question: "How should I evaluate a model gateway before launch?",
      tutors,
      aiClient: createMockTwutorAIClient(),
      idGenerator: () => "ask-1"
    });

    expect(thread).toMatchObject({
      id: "ask-1",
      learnerId: demoLearnerId,
      question: "How should I evaluate a model gateway before launch?"
    });
    expect(thread.responses).toHaveLength(1);
    expect(thread.responses[0]).toMatchObject({
      id: "ask-1-response-1",
      status: "draft",
      provider: "mock-openai",
      model: "gpt-4.1-mini-mock",
      tutorId: "eval"
    });
    expect(thread.responses[0].body).toContain("Start with the smallest eval that can block a bad launch");
    expect(thread.responses[0].guardrails).toContain("Keep the answer specific to the learner question");
    expect(thread.responses[0].followUpPrompt).toMatch(/follow-up/i);
    expect(thread.responses[0].prompt).toContain("How should I evaluate a model gateway before launch?");
  });

  it("retains invocation metadata and presents truthful response labels", async () => {
    const thread = await createAskTutorThread({
      learnerId: demoLearnerId,
      question: "Is the live tutor available?",
      tutors,
      aiClient: {
        async generateTutorResponse() {
          return { provider: "openai", model: "gpt-5.6-luna", body: "Please retry.", metadata: { outcome: "failure", errorCode: "AI_TIMEOUT", retryable: true } };
        },
        async generateContentDraft() { throw new Error("not used"); }
      },
      idGenerator: () => "ask-live"
    });

    expect(thread.responses[0].metadata).toMatchObject({ outcome: "failure", errorCode: "AI_TIMEOUT" });
    expect(getTutorResponseLabel(thread.responses[0])).toBe("AI temporarily unavailable");
    expect(getTutorResponseLabel({ ...thread.responses[0], metadata: { outcome: "success" } })).toBe("Live AI draft");
    expect(getTutorResponseLabel({ ...thread.responses[0], provider: "mock-openai", metadata: { mocked: true } })).toBe("Mock tutor draft");
    expect(getTutorResponseLabel({ ...thread.responses[0], metadata: {} })).toBe("AI draft · outcome unknown");
    expect(getTutorResponseLabel({ ...thread.responses[0], provider: "mock-openai", metadata: {} })).toBe("AI draft · outcome unknown");
    expect(getTutorResponseMetadataSummary({ outcome: "failure", errorCode: "AI_TIMEOUT", latencyMs: 15_000, totalTokens: null, prompt: "private", apiKey: "secret" })).toEqual({
      outcome: "failure",
      errorCode: "AI_TIMEOUT",
      latencyMs: 15_000,
      totalTokens: null
    });
  });
});
