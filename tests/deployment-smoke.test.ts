import { describe, expect, it } from "vitest";
import { validateSmokeResults } from "@/lib/deployment-smoke";

const healthy = { path: "/api/health", status: 200, body: { ok: true, database: "ok" } };
const signIn = { path: "/sign-in", status: 200, redirected: false };
const missing = { path: "/sign-in/not-a-real-route", status: 404 };

describe("deployment smoke validation", () => {
  it("accepts a healthy dependency check and expected route statuses", () => {
    expect(() => validateSmokeResults([healthy, signIn, missing])).not.toThrow();
  });

  it("rejects an unhealthy dependency or incomplete route matrix", () => {
    expect(() => validateSmokeResults([{ ...healthy, status: 503, body: { ok: false, database: "unavailable" } }, signIn, missing])).toThrow("health check failed");
    expect(() => validateSmokeResults([signIn, missing])).toThrow("missing smoke check: /api/health");
    expect(() => validateSmokeResults([healthy, { ...signIn, status: 500 }, missing])).toThrow("/sign-in returned 500");
    expect(() => validateSmokeResults([healthy, { ...signIn, status: 302, redirected: true }, missing])).toThrow("/sign-in redirected");
    expect(() => validateSmokeResults([healthy, signIn])).toThrow("missing smoke check: /sign-in/not-a-real-route");
  });
});
