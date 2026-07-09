import { describe, expect, it } from "vitest";
import { tutors } from "@/data/twutor";
import { createAskTutorThread } from "@/lib/ask-tutors";
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
});
