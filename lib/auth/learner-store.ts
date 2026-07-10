import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { learners } from "@/lib/db/schema";
import {
  createLearnerDraft,
  type AuthenticatedUser,
  type LearnerIdentityStore
} from "@/lib/auth/session-policy";

export type LearnerIdentity = typeof learners.$inferSelect;

export function createDatabaseLearnerIdentityStore(): LearnerIdentityStore<LearnerIdentity> {
  const db = getDb();

  return {
    async findOrCreateForAuthUser(user: AuthenticatedUser) {
      const [existing] = await db.select().from(learners).where(eq(learners.authUserId, user.id)).limit(1);
      if (existing) return existing;

      await db
        .insert(learners)
        .values(createLearnerDraft(user, randomUUID()))
        .onConflictDoNothing({ target: learners.authUserId });

      const [created] = await db.select().from(learners).where(eq(learners.authUserId, user.id)).limit(1);
      if (!created) throw new Error("Unable to provision learner identity.");
      return created;
    },

    async findDemoLearner(id: string) {
      const [learner] = await db.select().from(learners).where(eq(learners.id, id)).limit(1);
      return learner ?? null;
    }
  };
}
