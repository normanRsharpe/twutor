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
  metadata?: Record<string, unknown>;
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

export type AIInvocationEvent = {
  level: "info" | "error";
  event: "ai_invocation";
  outcome: "success" | "failure";
  provider: "openai";
  model: string;
  promptVersion: string;
  latencyMs: number;
  totalTokens: number | null;
  errorCode?: string;
};

type OpenAIClientOptions = {
  apiKey: string;
  model?: string;
  fetchImplementation?: typeof fetch;
  writeEvent?: (event: AIInvocationEvent) => void;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  timeoutMs?: number;
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

function writeAIEvent(event: AIInvocationEvent) {
  const writer = event.level === "error" ? console.error : console.info;
  writer(JSON.stringify(event));
}

export function createOpenAITwutorAIClient(options: OpenAIClientOptions): TwutorAIClient {
  const model = options.model ?? "gpt-5.6-luna";
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const writeEvent = options.writeEvent ?? writeAIEvent;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const maxAttempts = options.maxAttempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function generate(prompt: string, promptVersion: string) {
    const startedAt = now();
    const boundedPrompt = prompt.slice(0, 12_000);
    let response: Response | undefined;
    let responseBody: string | undefined;
    let failure: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImplementation("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            reasoning_effort: "high",
            messages: [{ role: "user", content: boundedPrompt }],
            response_format: {
          type: "json_schema",
          json_schema: {
            name: "twutor_generation",
            strict: true,
            schema: {
              type: "object",
              properties: { body: { type: "string" } },
              required: ["body"],
              additionalProperties: false
            }
          }
            }
          })
        });
        if (response.ok) {
          responseBody = await response.text();
          break;
        }
        if (response.status !== 429 && response.status < 500) break;
        failure = response.status === 429 ? "AI_RATE_LIMITED" : "AI_PROVIDER_FAILED";
      } catch (error) {
        response = undefined;
        failure = error instanceof DOMException && error.name === "AbortError" ? "AI_TIMEOUT" : "AI_PROVIDER_FAILED";
        if (failure === "AI_TIMEOUT") break;
      } finally {
        clearTimeout(timeout);
      }
      if (attempt < maxAttempts) await sleep(100 * 2 ** (attempt - 1));
    }

    if (!response?.ok) {
      const errorCode = typeof failure === "string" ? failure : "AI_PROVIDER_FAILED";
      const metadata = { outcome: "failure" as const, promptVersion, latencyMs: now() - startedAt, totalTokens: null, errorCode, retryable: true };
      writeEvent({ level: "error", event: "ai_invocation", provider: "openai", model, ...metadata });
      return { body: "We saved your request, but the AI provider is temporarily unavailable. Please retry.", metadata };
    }
    try {
      const payload = JSON.parse(responseBody ?? "") as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("missing structured content");
      const parsed = JSON.parse(content) as { body?: unknown };
      if (typeof parsed.body !== "string" || !parsed.body.trim()) throw new Error("missing body");
      const metadata = {
        outcome: "success" as const,
        promptVersion,
        latencyMs: now() - startedAt,
        inputTokens: payload.usage?.prompt_tokens ?? null,
        outputTokens: payload.usage?.completion_tokens ?? null,
        totalTokens: payload.usage?.total_tokens ?? null,
        estimatedCostUsd: null
      };
      writeEvent({ level: "info", event: "ai_invocation", provider: "openai", model, ...metadata });
      return { body: parsed.body, metadata };
    } catch {
      const metadata = { outcome: "failure" as const, promptVersion, latencyMs: now() - startedAt, totalTokens: null, errorCode: "AI_INVALID_RESPONSE", retryable: true };
      writeEvent({ level: "error", event: "ai_invocation", provider: "openai", model, ...metadata });
      return { body: "We saved your request, but the AI provider returned an invalid response. Please retry.", metadata };
    }
  }

  return {
    async generateTutorResponse(input) {
      const result = await generate(input.prompt, "tutor-response-v1");
      const body = result.metadata.outcome === "failure"
        ? "We saved your question, but the tutor is temporarily unavailable. Please retry."
        : result.body;
      return { provider: "openai", model, ...result, body };
    },
    async generateContentDraft(input) {
      const result = await generate(input.prompt, "content-draft-v1");
      const body = result.metadata.outcome === "failure"
        ? "We saved your draft request, but generation is temporarily unavailable. Please retry."
        : result.body;
      return { provider: "openai", model, ...result, body };
    }
  };
}

export function getTwutorAIClient(env: Partial<NodeJS.ProcessEnv> = process.env): TwutorAIClient {
  if (env.TWUTOR_OPENAI_MODE === "live") {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when TWUTOR_OPENAI_MODE=live");
    }
    return createOpenAITwutorAIClient({ apiKey: env.OPENAI_API_KEY, model: env.TWUTOR_OPENAI_MODEL });
  }

  return createMockTwutorAIClient();
}
