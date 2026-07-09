import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { posts as seedPosts, tutors as seedTutors, type TutorId } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import {
  learnerLearningStates,
  learnerPrivateNotes,
  learnerSavedPosts,
  learners,
  posts,
  tutorFollows,
  tutors
} from "@/lib/db/schema";
import {
  addFallbackLearnerPrivateNote,
  createSeedLearnerMemoryState,
  getFallbackLearnerMemoryState,
  summarizeLearnerMemory,
  type LearnerMemoryState,
  type LearnerMemorySummary
} from "@/lib/learner-memory";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

export type LearnerMemoryPost = {
  id: string;
  body: string;
  tutorName: string;
};

export type LearnerMemoryTutor = {
  id: TutorId;
  name: string;
  handle: string;
  avatarUrl: string;
  profileHeadline: string;
};

export type LearnerMemoryPageData = {
  summary: LearnerMemorySummary;
  savedPosts: LearnerMemoryPost[];
  followedTutors: LearnerMemoryTutor[];
};

function assembleLearnerMemoryPageData(
  state: LearnerMemoryState,
  postRows: { id: string; tutorId: string; body: string; sortOrder: number }[],
  tutorRows: { id: string; name: string; handle: string; avatarUrl: string; profileHeadline: string }[]
): LearnerMemoryPageData {
  const summary = summarizeLearnerMemory(state, demoLearnerId);
  const tutorsById = new Map(tutorRows.map((tutor) => [tutor.id, tutor]));
  const postsById = new Map(postRows.map((post) => [post.id, post]));

  return {
    summary,
    savedPosts: summary.savedPostIds
      .map((postId) => postsById.get(postId))
      .filter((post): post is NonNullable<typeof post> => Boolean(post))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((post) => ({
        id: post.id,
        body: post.body,
        tutorName: tutorsById.get(post.tutorId)?.name ?? post.tutorId
      })),
    followedTutors: summary.followedTutorIds
      .map((tutorId) => tutorsById.get(tutorId))
      .filter((tutor): tutor is NonNullable<typeof tutor> => Boolean(tutor))
      .map((tutor) => ({
        id: tutor.id as TutorId,
        name: tutor.name,
        handle: tutor.handle,
        avatarUrl: tutor.avatarUrl,
        profileHeadline: tutor.profileHeadline
      }))
  };
}

export async function getLearnerMemoryPageData(): Promise<LearnerMemoryPageData> {
  if (!getDatabaseUrl()) {
    const seed = buildSeedRows({ tutors: seedTutors, posts: seedPosts });
    return assembleLearnerMemoryPageData(getFallbackLearnerMemoryState(), seed.posts, seed.tutors);
  }

  const db = getDb();
  const [learnerRows, followRows, savedRows, learningStateRows, privateNoteRows, postRows, tutorRows] = await Promise.all([
    db.select().from(learners).where(eq(learners.id, demoLearnerId)),
    db.select().from(tutorFollows).where(eq(tutorFollows.learnerId, demoLearnerId)),
    db.select().from(learnerSavedPosts).where(eq(learnerSavedPosts.learnerId, demoLearnerId)),
    db.select().from(learnerLearningStates).where(eq(learnerLearningStates.learnerId, demoLearnerId)),
    db.select().from(learnerPrivateNotes).where(eq(learnerPrivateNotes.learnerId, demoLearnerId)).orderBy(asc(learnerPrivateNotes.createdAt)),
    db.select().from(posts).orderBy(asc(posts.sortOrder)),
    db.select().from(tutors).orderBy(asc(tutors.name))
  ]);

  return assembleLearnerMemoryPageData(
    createSeedLearnerMemoryState({
      learners: learnerRows,
      follows: followRows,
      savedPosts: savedRows,
      learningStates: learningStateRows,
      privateNotes: privateNoteRows
    }),
    postRows,
    tutorRows
  );
}

export async function addLearnerPrivateMemoryNote(body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;

  if (!getDatabaseUrl()) {
    addFallbackLearnerPrivateNote(trimmed, { id: randomUUID() });
    return;
  }

  await getDb().insert(learnerPrivateNotes).values({
    id: randomUUID(),
    learnerId: demoLearnerId,
    body: trimmed
  });
}
