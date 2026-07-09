import type { TutorId } from "@/data/twutor";
import { posts as seedPosts, tutors as seedTutors } from "@/data/twutor";
import type { SeedRows } from "@/lib/seed-data";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

export type LearnerPrivateNote = {
  id: string;
  learnerId: string;
  body: string;
  createdAt?: Date;
};

export type LearnerMemoryState = Pick<SeedRows, "learners" | "follows" | "savedPosts" | "learningStates"> & {
  privateNotes: LearnerPrivateNote[];
};

export type LearnerMemorySummary = {
  learnerId: string;
  name: string;
  handle: string;
  avatarUrl: string;
  savedPostCount: number;
  followedTutorCount: number;
  savedPostIds: string[];
  followedTutorIds: string[];
  currentArc: string;
  progressPercent: number;
  focusTopics: string[];
  lastSignal: string;
  privateNotes: LearnerPrivateNote[];
};

let fallbackLearnerMemoryState: LearnerMemoryState | undefined;

export function createSeedLearnerMemoryState(
  seed: Pick<SeedRows, "learners" | "follows" | "savedPosts" | "learningStates"> & { privateNotes?: LearnerPrivateNote[] }
): LearnerMemoryState {
  return {
    learners: [...seed.learners],
    follows: [...seed.follows],
    savedPosts: [...seed.savedPosts],
    learningStates: [...seed.learningStates],
    privateNotes: [...(seed.privateNotes ?? [])]
  };
}

export function saveLearnerPost(state: LearnerMemoryState, learnerId: string, postId: string, saved: boolean): LearnerMemoryState {
  const exists = state.savedPosts.some((row) => row.learnerId === learnerId && row.postId === postId);
  if (saved && exists) return state;

  return {
    ...state,
    savedPosts: saved
      ? [...state.savedPosts, { learnerId, postId }]
      : state.savedPosts.filter((row) => !(row.learnerId === learnerId && row.postId === postId))
  };
}

export function setLearnerTutorFollow(state: LearnerMemoryState, learnerId: string, tutorId: string, follow: boolean): LearnerMemoryState {
  const exists = state.follows.some((row) => row.learnerId === learnerId && row.tutorId === tutorId);
  if (follow && exists) return state;

  return {
    ...state,
    follows: follow
      ? [...state.follows, { learnerId, tutorId }]
      : state.follows.filter((row) => !(row.learnerId === learnerId && row.tutorId === tutorId))
  };
}

export function addPrivateLearnerNote(
  state: LearnerMemoryState,
  learnerId: string,
  body: string,
  options: { id?: string; now?: Date } = {}
): LearnerMemoryState {
  const trimmed = body.trim();
  if (!trimmed) return state;

  return {
    ...state,
    privateNotes: [
      ...state.privateNotes,
      {
        id: options.id ?? `note-${Date.now().toString(36)}`,
        learnerId,
        body: trimmed,
        createdAt: options.now ?? new Date()
      }
    ]
  };
}

export function summarizeLearnerMemory(state: LearnerMemoryState, learnerId: string): LearnerMemorySummary {
  const learner = state.learners.find((row) => row.id === learnerId);
  if (!learner) throw new Error(`Missing learner ${learnerId}`);

  const learningState = state.learningStates.find((row) => row.learnerId === learnerId);
  const savedPostIds = state.savedPosts.filter((row) => row.learnerId === learnerId).map((row) => row.postId);
  const followedTutorIds = state.follows
    .filter((row) => row.learnerId === learnerId)
    .map((row) => row.tutorId as TutorId);

  return {
    learnerId: learner.id,
    name: learner.name,
    handle: learner.handle,
    avatarUrl: learner.avatarUrl,
    savedPostCount: savedPostIds.length,
    followedTutorCount: followedTutorIds.length,
    savedPostIds,
    followedTutorIds,
    currentArc: learningState?.currentArc ?? "Unstarted learning arc",
    progressPercent: learningState?.progressPercent ?? 0,
    focusTopics: learningState?.focusTopics ?? [],
    lastSignal: learningState?.lastSignal ?? "No signal yet",
    privateNotes: state.privateNotes.filter((note) => note.learnerId === learnerId)
  };
}

export function getFallbackLearnerMemoryState() {
  fallbackLearnerMemoryState ??= createSeedLearnerMemoryState(buildSeedRows({ tutors: seedTutors, posts: seedPosts }));
  return fallbackLearnerMemoryState;
}

export function resetFallbackLearnerMemoryState() {
  fallbackLearnerMemoryState = createSeedLearnerMemoryState(buildSeedRows({ tutors: seedTutors, posts: seedPosts }));
  return fallbackLearnerMemoryState;
}

export function updateFallbackLearnerPostSaved(postId: string, saved: boolean) {
  fallbackLearnerMemoryState = saveLearnerPost(getFallbackLearnerMemoryState(), demoLearnerId, postId, saved);
}

export function updateFallbackLearnerTutorFollow(tutorId: string, follow: boolean) {
  fallbackLearnerMemoryState = setLearnerTutorFollow(getFallbackLearnerMemoryState(), demoLearnerId, tutorId, follow);
}

export function addFallbackLearnerPrivateNote(body: string, options: { id?: string; now?: Date } = {}) {
  fallbackLearnerMemoryState = addPrivateLearnerNote(getFallbackLearnerMemoryState(), demoLearnerId, body, options);
}
