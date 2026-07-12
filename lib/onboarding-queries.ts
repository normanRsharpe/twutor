import { and, eq } from "drizzle-orm";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { learnerLearningStates, learnerOnboardings, tutorFollows } from "@/lib/db/schema";
import { createColdStartLearningState, normalizeOnboardingSelection } from "@/lib/onboarding";

export async function getLearnerOnboarding(learnerId: string) {
  if (!getDatabaseUrl()) {
    return {
      learnerId,
      goal: null,
      level: null,
      cadence: null,
      topics: [],
      tutorIds: [],
      completedAt: new Date(0),
      skippedAt: null,
      updatedAt: new Date(0)
    };
  }
  const [onboarding] = await getDb().select().from(learnerOnboardings).where(eq(learnerOnboardings.learnerId, learnerId)).limit(1);
  return onboarding ?? null;
}

export async function completeLearnerOnboarding({ learnerId, goal, level, cadence, topics, tutors, skipped }: {
  learnerId: string;
  goal: string;
  level: string;
  cadence: string;
  topics: string[];
  tutors: string[];
  skipped: boolean;
}) {
  const selection = normalizeOnboardingSelection({ topics, tutors });
  const state = createColdStartLearningState({ goal, level, topics: selection.topics, cadence });
  const now = new Date();
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .insert(learnerOnboardings)
      .values({ learnerId, goal: goal || null, level: level || null, cadence: cadence || null, topics: selection.topics, tutorIds: selection.tutors, completedAt: skipped ? null : now, skippedAt: skipped ? now : null, updatedAt: now })
      .onConflictDoUpdate({ target: learnerOnboardings.learnerId, set: { goal: goal || null, level: level || null, cadence: cadence || null, topics: selection.topics, tutorIds: selection.tutors, completedAt: skipped ? null : now, skippedAt: skipped ? now : null, updatedAt: now } });
    await tx
      .insert(learnerLearningStates)
      .values({ learnerId, ...state, updatedAt: now })
      .onConflictDoUpdate({ target: learnerLearningStates.learnerId, set: { ...state, updatedAt: now } });
    await tx.delete(tutorFollows).where(eq(tutorFollows.learnerId, learnerId));
    if (selection.tutors.length) await tx.insert(tutorFollows).values(selection.tutors.map((tutorId) => ({ learnerId, tutorId }))).onConflictDoNothing();
  });
}
