import type { Tutor, TutorId } from "@/data/twutor";
import type { TwutorAIClient } from "@/lib/twutor-ai";

export type AskTutorResponseDraft = {
  id: string;
  questionId: string;
  tutorId: TutorId;
  status: "draft" | "published";
  body: string;
  guardrails: string[];
  followUpPrompt: string;
  provider: string;
  model: string;
  metadata: Record<string, unknown>;
  prompt: string;
  createdAt: Date;
};

export type AskTutorThread = {
  id: string;
  learnerId: string;
  question: string;
  status: "answered";
  createdAt: Date;
  responses: AskTutorResponseDraft[];
};

export function getTutorResponseLabel(response: Pick<AskTutorResponseDraft, "provider" | "metadata">) {
  if (response.metadata.outcome === "failure") return "AI temporarily unavailable";
  if (response.metadata.mocked === true) return "Mock tutor draft";
  if (response.metadata.outcome !== "success") return "AI draft · outcome unknown";
  return "Live AI draft";
}

export function getTutorResponseMetadataSummary(metadata: Record<string, unknown>) {
  const allowedKeys = ["outcome", "errorCode", "promptVersion", "latencyMs", "inputTokens", "outputTokens", "totalTokens", "estimatedCostUsd", "retryable"] as const;
  return Object.fromEntries(allowedKeys.filter((key) => key in metadata).map((key) => [key, metadata[key]]));
}

export function selectTutorForQuestion(question: string, tutors: Record<TutorId, Tutor>): Tutor {
  const normalized = question.toLowerCase();
  if (/eval|test|quality|launch|regression/.test(normalized)) return tutors.eval;
  if (/rag|retrieval|citation|context/.test(normalized)) return tutors.nora;
  if (/security|permission|policy|guardrail/.test(normalized)) return tutors.sam;
  if (/trace|debug|observability|span/.test(normalized)) return tutors.iris;
  if (/cost|latency|runtime|gpu|inference/.test(normalized)) return tutors.theo;
  return tutors.maya;
}

export function buildAskTutorPrompt({ question, tutor, learnerContext }: { question: string; tutor: Tutor; learnerContext?: string }) {
  return [
    `You are ${tutor.name} (${tutor.handle}), a Twutor persona for ${tutor.angle}.`,
    "Answer as a concise social-learning tutor reply, not a generic lesson.",
    "Include one concrete next step and avoid pretending the answer is final.",
    learnerContext ? `Learner context: ${learnerContext}` : null,
    `Learner question: ${question}`
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createAskTutorThread({
  learnerId,
  question,
  tutors,
  aiClient,
  idGenerator = () => crypto.randomUUID(),
  now = () => new Date(),
  learnerContext
}: {
  learnerId: string;
  question: string;
  tutors: Record<TutorId, Tutor>;
  aiClient: TwutorAIClient;
  idGenerator?: () => string;
  now?: () => Date;
  learnerContext?: string;
}): Promise<AskTutorThread> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) throw new Error("Question is required");

  const id = idGenerator();
  const tutor = selectTutorForQuestion(trimmedQuestion, tutors);
  const prompt = buildAskTutorPrompt({ question: trimmedQuestion, tutor, learnerContext });
  const generation = await aiClient.generateTutorResponse({ question: trimmedQuestion, tutor, prompt, learnerContext });
  const createdAt = now();

  return {
    id,
    learnerId,
    question: trimmedQuestion,
    status: "answered",
    createdAt,
    responses: [
      {
        id: `${id}-response-1`,
        questionId: id,
        tutorId: tutor.id,
        status: "draft",
        body: generation.body,
        guardrails: [
          "Keep the answer specific to the learner question",
          "State uncertainty and suggest one follow-up move",
          "Stay in the tutor persona voice"
        ],
        followUpPrompt: "Ask a follow-up or turn this into a build-lab challenge.",
        provider: generation.provider,
        model: generation.model,
        metadata: generation.metadata ?? { mocked: generation.provider === "mock-openai" },
        prompt,
        createdAt
      }
    ]
  };
}
