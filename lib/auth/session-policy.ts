export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type LearnerIdentityStore<TLearner> = {
  findOrCreateForAuthUser(user: AuthenticatedUser): Promise<TLearner>;
  findDemoLearner(id: string): Promise<TLearner | null>;
};

export function createLearnerDraft(user: AuthenticatedUser, learnerId: string) {
  const name = user.name.trim() || "Twutor learner";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "learner";
  const learnerSuffix = learnerId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return {
    id: learnerId,
    authUserId: user.id,
    name,
    handle: `@${slug}-${learnerSuffix}`,
    avatarUrl: user.image || "/assets/avatars/learner.svg"
  };
}

export function isLocalDemoMode({ nodeEnv, enabled }: { nodeEnv: string | undefined; enabled: string | undefined }) {
  return nodeEnv === "development" && enabled === "true";
}

export function isMultiUserRolloutEnabled({ nodeEnv, enabled }: { nodeEnv?: string; enabled?: string }) {
  return nodeEnv !== "production" || enabled === "true";
}

export function isAdminAuthUser(authUserId: string | null, configuredAdminIds: string | undefined, demoMode: boolean) {
  if (demoMode) return true;
  if (!authUserId) return false;
  return (configuredAdminIds ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(authUserId);
}

export async function resolveLearnerIdentity<TLearner>({
  user,
  store,
  demoMode,
  demoLearnerId
}: {
  user: AuthenticatedUser | null;
  store: LearnerIdentityStore<TLearner>;
  demoMode: boolean;
  demoLearnerId?: string;
}): Promise<TLearner | null> {
  if (user) return store.findOrCreateForAuthUser(user);
  if (!demoMode || !demoLearnerId) return null;
  return store.findDemoLearner(demoLearnerId);
}
