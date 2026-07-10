import { describe, expect, it } from "vitest";
import { isPublicOperationalPath } from "@/lib/auth/public-routes";

describe("public operational routes", () => {
  it("allows readiness checks without initializing learner authentication", () => {
    expect(isPublicOperationalPath("/api/health")).toBe(true);
    expect(isPublicOperationalPath("/api/health/extra")).toBe(false);
    expect(isPublicOperationalPath("/")).toBe(false);
  });
});