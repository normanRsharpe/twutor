import { describe, expect, it, vi } from "vitest";
import { tutors } from "@/data/twutor";
import { createOpenAITwutorAIClient, getTwutorAIClient } from "@/lib/twutor-ai";

const tutorInput = {
  question: "How should I evaluate a model gateway?",
  tutor: tutors.eval,
  prompt: "Answer as Eval Kapoor.",
  learnerContext: "Learning model gateways"
};

describe("Twutor AI runtime", () => {
  it("uses deterministic mock mode unless live mode is explicitly enabled", async () => {
    const client = getTwutorAIClient({});

    await expect(client.generateTutorResponse(tutorInput)).resolves.toMatchObject({
      provider: "mock-openai",
      model: "gpt-4.1-mini-mock",
      body: expect.stringContaining("smallest eval")
    });
  });

  it("rejects live mode when required configuration is missing", () => {
    expect(() => getTwutorAIClient({ TWUTOR_OPENAI_MODE: "live" })).toThrow(
      "OPENAI_API_KEY is required when TWUTOR_OPENAI_MODE=live"
    );
  });

  it("returns a structured tutor response and emits safe invocation metadata", async () => {
    const writeEvent = vi.fn();
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: "Bearer test-secret" });
      const request = JSON.parse(String(init?.body)) as { model: string; reasoning_effort: string };
      expect(request).toMatchObject({ model: "gpt-5.6-luna", reasoning_effort: "high" });
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ body: "Run a shadow evaluation before routing production traffic." }) } }],
        usage: { prompt_tokens: 21, completion_tokens: 9, total_tokens: 30 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = createOpenAITwutorAIClient({
      apiKey: "test-secret",
      fetchImplementation,
      writeEvent,
      now: () => 1_000
    });

    await expect(client.generateTutorResponse(tutorInput)).resolves.toMatchObject({
      provider: "openai",
      model: "gpt-5.6-luna",
      body: "Run a shadow evaluation before routing production traffic.",
      metadata: { outcome: "success", promptVersion: "tutor-response-v1", totalTokens: 30 }
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(writeEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: "ai_invocation",
      outcome: "success",
      provider: "openai",
      model: "gpt-5.6-luna",
      promptVersion: "tutor-response-v1",
      totalTokens: 30
    }));
    expect(JSON.stringify(writeEvent.mock.calls)).not.toContain("test-secret");
    expect(JSON.stringify(writeEvent.mock.calls)).not.toContain(tutorInput.prompt);
  });

  it("returns a recoverable result and failure event when the provider times out", async () => {
    const writeEvent = vi.fn();
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      throw new DOMException("timed out", "AbortError");
    });
    const client = createOpenAITwutorAIClient({ apiKey: "test-secret", fetchImplementation, writeEvent });

    await expect(client.generateTutorResponse(tutorInput)).resolves.toMatchObject({
      provider: "openai",
      body: expect.stringContaining("saved your question"),
      metadata: { outcome: "failure", errorCode: "AI_TIMEOUT", retryable: true }
    });
    expect(writeEvent).toHaveBeenCalledWith(expect.objectContaining({ outcome: "failure", errorCode: "AI_TIMEOUT" }));
  });

  it("retries a rate limit and returns a recoverable provider failure", async () => {
    const writeEvent = vi.fn();
    const fetchImplementation = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const client = createOpenAITwutorAIClient({
      apiKey: "test-secret",
      fetchImplementation,
      writeEvent,
      sleep: async () => undefined,
      maxAttempts: 2
    });

    await expect(client.generateContentDraft({
      kind: "post",
      tutor: tutors.maya,
      theme: "Model gateways",
      prompt: "Draft a model gateway post."
    })).resolves.toMatchObject({
      provider: "openai",
      body: expect.stringContaining("saved your draft request"),
      metadata: { outcome: "failure", errorCode: "AI_RATE_LIMITED", retryable: true }
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("keeps the timeout active while reading the provider response body", async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: () => new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("timed out", "AbortError")));
      })
    }) as Response);
    const client = createOpenAITwutorAIClient({ apiKey: "test-secret", fetchImplementation, timeoutMs: 5 });

    await expect(client.generateTutorResponse(tutorInput)).resolves.toMatchObject({
      metadata: { outcome: "failure", errorCode: "AI_TIMEOUT", retryable: true }
    });
  });

  it("returns a recoverable result for malformed structured output", async () => {
    const writeEvent = vi.fn();
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ body: "" }) } }]
    }), { status: 200 }));
    const client = createOpenAITwutorAIClient({ apiKey: "test-secret", fetchImplementation, writeEvent });

    await expect(client.generateContentDraft({
      kind: "post",
      tutor: tutors.maya,
      theme: "Model gateways",
      prompt: "Draft a model gateway post."
    })).resolves.toMatchObject({
      body: expect.stringContaining("saved your draft request"),
      metadata: { outcome: "failure", errorCode: "AI_INVALID_RESPONSE", retryable: true }
    });
    expect(writeEvent).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "AI_INVALID_RESPONSE" }));
  });

  it("bounds serialized prompts to 12000 characters", async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> };
      expect(request.messages[0].content).toHaveLength(12_000);
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ body: "Bounded." }) } }]
      }), { status: 200 });
    });
    const client = createOpenAITwutorAIClient({ apiKey: "test-secret", fetchImplementation });

    await client.generateTutorResponse({ ...tutorInput, prompt: "x".repeat(20_000) });
  });
});
