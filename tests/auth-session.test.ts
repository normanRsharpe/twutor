import { describe, expect, it } from "vitest";
import { validateAuthEnvironment } from "@/lib/auth/environment";
import {
  createLearnerDraft,
  isAdminAuthUser,
  isLocalDemoMode,
  isMultiUserRolloutEnabled,
  resolveLearnerIdentity,
  type AuthenticatedUser,
  type LearnerIdentityStore
} from "@/lib/auth/session-policy";

type Learner = { id: string; authUserId: string | null; name: string };

function createStore(): LearnerIdentityStore<Learner> & { learners: Learner[] } {
  const learners: Learner[] = [];

  return {
    learners,
    async findOrCreateForAuthUser(user: AuthenticatedUser) {
      const existing = learners.find((learner) => learner.authUserId === user.id);
      if (existing) return existing;

      const learner = { id: `learner-${learners.length + 1}`, authUserId: user.id, name: user.name };
      learners.push(learner);
      return learner;
    },
    async findDemoLearner(id: string) {
      return learners.find((learner) => learner.id === id) ?? null;
    }
  };
}

describe("authenticated learner resolution", () => {
  it("fails closed when required production auth configuration is missing", () => {
    expect(() => validateAuthEnvironment({ DATABASE_URL: "postgres://db", BETTER_AUTH_SECRET: "", BETTER_AUTH_URL: "https://twutor.example" })).toThrow(
      "BETTER_AUTH_SECRET"
    );
    expect(() => validateAuthEnvironment({ DATABASE_URL: "postgres://db", BETTER_AUTH_SECRET: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", BETTER_AUTH_URL: "http://twutor.example" })).toThrow(
      "BETTER_AUTH_URL"
    );
  });

  it("rejects weak session-signing secrets", () => {
    expect(() => validateAuthEnvironment({ DATABASE_URL: "postgres://db", BETTER_AUTH_SECRET: "a".repeat(64), BETTER_AUTH_URL: "https://twutor.example" })).toThrow(
      "entropy"
    );
  });

  it("keeps production multi-user access disabled until explicitly released", () => {
    expect(isMultiUserRolloutEnabled({ nodeEnv: "production", enabled: undefined })).toBe(false);
    expect(isMultiUserRolloutEnabled({ nodeEnv: "production", enabled: "true" })).toBe(true);
    expect(isMultiUserRolloutEnabled({ nodeEnv: "development", enabled: undefined })).toBe(true);
  });

  it("authorizes admin operations only through immutable auth user IDs", () => {
    expect(isAdminAuthUser("auth-admin", "auth-admin,other-admin", false)).toBe(true);
    expect(isAdminAuthUser("ordinary-user", "auth-admin,other-admin", false)).toBe(false);
    expect(isAdminAuthUser(null, undefined, true)).toBe(true);
  });

  it("creates a learner profile from immutable auth identity without using email as its key", () => {
    const draft = createLearnerDraft(
      { id: "auth-user-12345678", name: "  Ada Learner  ", email: "ada@example.com", image: null },
      "learner-domain-id"
    );

    expect(draft).toEqual({
      id: "learner-domain-id",
      authUserId: "auth-user-12345678",
      name: "Ada Learner",
      handle: "@ada-learner-learnerdomainid",
      avatarUrl: "/assets/avatars/learner.svg"
    });
    expect(draft.id).not.toBe("ada@example.com");
  });

  it("creates collision-safe handles for learners with matching names and auth id suffixes", () => {
    const first = createLearnerDraft(
      { id: "provider-one-abcdefgh", name: "Same Name", email: "one@example.com" },
      "learner-11111111-aaaa"
    );
    const second = createLearnerDraft(
      { id: "provider-two-abcdefgh", name: "Same Name", email: "two@example.com" },
      "learner-22222222-bbbb"
    );

    expect(first.handle).not.toBe(second.handle);
  });

  it("maps repeated sessions for one auth user to one stable learner", async () => {
    const store = createStore();
    const user = { id: "auth-user-1", name: "Ada Learner", email: "ada@example.com" };

    const first = await resolveLearnerIdentity({ user, store, demoMode: false });
    const second = await resolveLearnerIdentity({ user, store, demoMode: false });

    expect(first).toEqual(second);
    expect(store.learners).toHaveLength(1);
    expect(first).toMatchObject({ authUserId: "auth-user-1", name: "Ada Learner" });
  });

  it("maps different auth users to different learners", async () => {
    const store = createStore();

    const first = await resolveLearnerIdentity({
      user: { id: "auth-user-1", name: "Ada", email: "ada@example.com" },
      store,
      demoMode: false
    });
    const second = await resolveLearnerIdentity({
      user: { id: "auth-user-2", name: "Grace", email: "grace@example.com" },
      store,
      demoMode: false
    });

    expect(first?.id).not.toBe(second?.id);
  });

  it("fails closed without a session outside explicit local demo mode", async () => {
    const store = createStore();

    await expect(resolveLearnerIdentity({ user: null, store, demoMode: false })).resolves.toBeNull();
  });

  it("allows the seeded learner only in explicit local development mode", async () => {
    const store = createStore();
    store.learners.push({ id: "norman", authUserId: null, name: "Norman Sharpe" });

    expect(isLocalDemoMode({ nodeEnv: "development", enabled: "true" })).toBe(true);
    expect(isLocalDemoMode({ nodeEnv: "production", enabled: "true" })).toBe(false);
    expect(isLocalDemoMode({ nodeEnv: "development", enabled: undefined })).toBe(false);

    await expect(resolveLearnerIdentity({ user: null, store, demoMode: true, demoLearnerId: "norman" })).resolves.toMatchObject({ id: "norman" });
  });
});
