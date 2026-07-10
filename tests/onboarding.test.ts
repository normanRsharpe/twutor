import { describe, expect, it } from "vitest";
import { createColdStartLearningState, normalizeOnboardingSelection } from "@/lib/onboarding";

describe("first-run onboarding", () => {
  it("creates a truthful zero-progress learning state from selected interests", () => {
    expect(createColdStartLearningState({ goal: "Ship reliable AI systems", level: "building", topics: ["LLM evals", "Observability"], cadence: "3x weekly" })).toEqual({
      title: "Platform × AI Engineering",
      currentArc: "Your first learning arc",
      progressPercent: 0,
      focusTopics: ["LLM evals", "Observability"],
      lastSignal: "Starting with your selected goals · 3x weekly"
    });
  });

  it("deduplicates and bounds learner-selected tutors and topics", () => {
    expect(normalizeOnboardingSelection({ tutors: ["maya", "maya", "eval", "unknown"], topics: ["LLM evals", "LLM evals", "", "Observability"] })).toEqual({
      tutors: ["maya", "eval"],
      topics: ["LLM evals", "Observability"]
    });
  });
});
