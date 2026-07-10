import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  learnerOnboardings,
  learners
} from "@/lib/db/schema";

describe("authentication schema", () => {
  it("keeps provider users separate from Twutor learners", () => {
    expect(getTableName(authUsers)).toBe("auth_users");
    expect(getTableName(learners)).toBe("learners");
    expect(learners.authUserId).toBeDefined();
    expect(authUsers.email).toBeDefined();
  });

  it("tracks a learner's durable onboarding choices separately from auth identity", () => {
    expect(getTableName(learnerOnboardings)).toBe("learner_onboardings");
    expect(learnerOnboardings.learnerId).toBeDefined();
    expect(learnerOnboardings.completedAt).toBeDefined();
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
