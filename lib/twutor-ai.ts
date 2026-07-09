import type { Tutor, TutorId } from "@/data/twutor";

export type TutorResponseGenerationInput = {
  question: string;
  tutor: Tutor;
  prompt: string;
  learnerContext?: string;
};

export type TutorResponseGeneration = {
  provider: string;
  model: string;
  body: string;
};

export type ContentDraftGenerationInput = {
  kind: string;
  tutor: Tutor;
  theme: string;
  prompt: string;
};

export type ContentDraftGeneration = {
  provider: string;
  model: string;
  body: string;
  metadata: Record<string, unknown>;
};

export type TwutorAIClient = {
  generateTutorResponse(input: TutorResponseGenerationInput): Promise<TutorResponseGeneration>;
  generateContentDraft(input: ContentDraftGenerationInput): Promise<ContentDraftGeneration>;
};

const tutorOpeners: Record<TutorId, string> = {
  eval: "Start with the smallest eval that can block a bad launch, then make every failure a regression case.",
  maya: "Treat this like a platform seam: name the paved road, the escape hatch, and the ownership boundary.",
  nora: "First ask what answer the learner needs to trust, then inspect the citations and context path.",
  sam: "Name the permission boundary before naming the agent. Most incidents start as confused-deputy problems.",
  iris: "Trace the request like evidence: inputs, retrieval, tool calls, policy result, and why anyone trusted it.",
  theo: "Put latency, cost, and fallback behavior beside the architecture before the prototype teaches bad habits."
};

function mockTutorBody(input: TutorResponseGenerationInput) {
  return `${tutorOpeners[input.tutor.id]}\n\nFor “${input.question}”, I would turn the answer into one concrete check, one artifact to inspect, and one follow-up experiment.`;
}

export function createMockTwutorAIClient(): TwutorAIClient {
  return {
    async generateTutorResponse(input) {
      return {
        provider: "mock-openai",
        model: "gpt-4.1-mini-mock",
        body: mockTutorBody(input)
      };
    },
    async generateContentDraft(input) {
      return {
        provider: "mock-openai",
        model: "gpt-4.1-mini-mock",
        body: `Mock ${input.kind} draft from ${input.tutor.name}: ${input.theme}. Make it feed-native, specific, and reviewable before publish.`,
        metadata: {
          mocked: true,
          kind: input.kind,
          tutorId: input.tutor.id,
          promptLength: input.prompt.length
        }
      };
    }
  };
}

export function getTwutorAIClient(env: Partial<NodeJS.ProcessEnv> = process.env): TwutorAIClient {
  if (env.TWUTOR_OPENAI_MODE === "live") {
    throw new Error("Live OpenAI mode is not wired in this milestone; use TWUTOR_OPENAI_MODE=mock for deterministic tests.");
  }

  return createMockTwutorAIClient();
}
