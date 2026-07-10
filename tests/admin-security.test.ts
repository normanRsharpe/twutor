import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { adminAuditEvents } from "@/lib/db/schema";
import { canRunDevelopmentReset } from "@/lib/admin-security";

describe("admin security policy", () => {
  it("records each admin mutation against its immutable actor", () => {
    expect(getTableName(adminAuditEvents)).toBe("admin_audit_events");
    expect(adminAuditEvents.actorAuthUserId).toBeDefined();
    expect(adminAuditEvents.outcome).toBeDefined();
  });

  it("fails closed for reset URLs outside explicitly enabled local development", () => {
    expect(canRunDevelopmentReset({ nodeEnv: "production", enabled: "true" })).toBe(false);
    expect(canRunDevelopmentReset({ nodeEnv: "development", enabled: undefined })).toBe(false);
    expect(canRunDevelopmentReset({ nodeEnv: "development", enabled: "true" })).toBe(true);
  });
});
