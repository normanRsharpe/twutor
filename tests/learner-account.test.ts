import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import {
  addPrivateLearnerNote,
  createSeedLearnerMemoryState,
  saveLearnerPost,
  setLearnerTutorFollow,
  summarizeLearnerMemory
} from "@/lib/learner-memory";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("learner account memory", () => {
  it("keeps learner identity, saved posts, follows, arc state, and private notes in one account summary", () => {
    const seed = buildSeedRows({ tutors, posts });
    let memory = createSeedLearnerMemoryState(seed);

    memory = saveLearnerPost(memory, demoLearnerId, "ai-trace", true);
    memory = setLearnerTutorFollow(memory, demoLearnerId, "nora", true);
    memory = addPrivateLearnerNote(memory, demoLearnerId, "Need to revisit citation quality before agents.", { id: "note-1" });

    const summary = summarizeLearnerMemory(memory, demoLearnerId);

    expect(summary).toMatchObject({
      learnerId: demoLearnerId,
      name: "Norman Sharpe",
      handle: "@learner",
      savedPostCount: 3,
      followedTutorCount: 3,
      currentArc: "AI systems as platform problems",
      progressPercent: 42
    });
    expect(summary.savedPostIds).toContain("ai-trace");
    expect(summary.followedTutorIds).toContain("nora");
    expect(summary.privateNotes).toEqual([
      expect.objectContaining({ id: "note-1", body: "Need to revisit citation quality before agents." })
    ]);
  });
});
