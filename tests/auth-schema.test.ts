import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  learners
} from "@/lib/db/schema";

describe("authentication schema", () => {
  it("keeps provider users separate from Twutor learners", () => {
    expect(getTableName(authUsers)).toBe("auth_users");
    expect(getTableName(learners)).toBe("learners");
    expect(learners.authUserId).toBeDefined();
    expect(authUsers.email).toBeDefined();
  });

  it("provides the Better Auth user, session, account, and verification models", () => {
    expect(getTableName(authSessions)).toBe("auth_sessions");
    expect(getTableName(authAccounts)).toBe("auth_accounts");
    expect(getTableName(authVerifications)).toBe("auth_verifications");
    expect(authSessions.token).toBeDefined();
    expect(authAccounts.password).toBeDefined();
    expect(authVerifications.identifier).toBeDefined();
  });
});
