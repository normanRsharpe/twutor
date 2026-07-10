import { describe, expect, it, vi } from "vitest";
import { createOperationalErrorEvent, runObservedAction } from "@/lib/operational-events";

describe("operational events", () => {
  it("creates a safe structured error without learner identifiers or arbitrary messages", () => {
    const event = createOperationalErrorEvent({ action: "ask_tutors" }, new Error("private learner content"), "2026-07-10T05:30:00.000Z");

    expect(event).toEqual({
      level: "error",
      event: "critical_action_failed",
      action: "ask_tutors",
      errorCode: "ACTION_FAILED",
      occurredAt: "2026-07-10T05:30:00.000Z"
    });
    expect(JSON.stringify(event)).not.toContain("private learner content");
  });

  it("logs and rethrows failed critical actions", async () => {
    const writeEvent = vi.fn();
    const failure = new Error("write failed");

    await expect(runObservedAction({ action: "onboarding" }, async () => { throw failure; }, writeEvent)).rejects.toBe(failure);
    expect(writeEvent).toHaveBeenCalledOnce();
    expect(writeEvent.mock.calls[0][0]).toEqual(expect.objectContaining({ event: "critical_action_failed", action: "onboarding", errorCode: "ACTION_FAILED" }));
  });
});