import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDatabaseUrl } from "@/lib/db/client";
import { demoLearnerId } from "@/lib/seed-data";
import { getAuth } from "@/lib/auth/auth";
import { createDatabaseLearnerIdentityStore, type LearnerIdentity } from "@/lib/auth/learner-store";
import { isAdminAuthUser, isLocalDemoMode, isMultiUserRolloutEnabled, resolveLearnerIdentity } from "@/lib/auth/session-policy";

const localDemoLearner: LearnerIdentity = {
  id: demoLearnerId,
  authUserId: null,
  name: "Norman Sharpe",
  handle: "@learner",
  avatarUrl: "/assets/avatars/learner.svg",
  createdAt: new Date(0)
};

export function localDemoModeEnabled() {
  return isLocalDemoMode({
    nodeEnv: process.env.NODE_ENV,
    enabled: process.env.TWUTOR_DEMO_MODE
  });
}

export function multiUserRolloutEnabled() {
  return isMultiUserRolloutEnabled({ nodeEnv: process.env.NODE_ENV, enabled: process.env.TWUTOR_MULTI_USER_ENABLED });
}

export async function getCurrentLearner(): Promise<LearnerIdentity | null> {
  if (!multiUserRolloutEnabled()) throw new Error("Twutor multi-user access is disabled until learner data isolation is complete.");
  const demoMode = localDemoModeEnabled();

  if (demoMode && !getDatabaseUrl()) return localDemoLearner;
  if (!getDatabaseUrl()) throw new Error("DATABASE_URL is required when Twutor demo mode is disabled.");

  const session = demoMode
    ? null
    : await getAuth().api.getSession({
        headers: await headers()
      });

  return resolveLearnerIdentity({
    user: session?.user ?? null,
    store: createDatabaseLearnerIdentityStore(),
    demoMode,
    demoLearnerId
  });
}

export async function requireCurrentLearner() {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/sign-in");
  return learner;
}

export async function requireAdminLearner() {
  const learner = await requireCurrentLearner();
  if (!isAdminAuthUser(learner.authUserId, process.env.TWUTOR_ADMIN_USER_IDS, localDemoModeEnabled())) notFound();
  return learner;
}
