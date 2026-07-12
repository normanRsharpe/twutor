import { describe, expect, it } from "vitest";
import { getFeedData, recordLearnerFeedback, recordPostFeedEvent } from "@/lib/feed-queries";

describe("fallback learner feedback", () => {
  it("does not suppress a post for a different learner", async () => {
    const learnerA = "feedback-learner-a";
    const learnerB = "feedback-learner-b";
    const initialFeed = await getFeedData({ learnerId: learnerA });
    const postId = initialFeed.posts[0].id;

    await recordLearnerFeedback(learnerA, postId, "less_like_this");

    expect((await getFeedData({ learnerId: learnerA })).posts.some((post) => post.id === postId)).toBe(false);
    expect((await getFeedData({ learnerId: learnerB })).posts.some((post) => post.id === postId)).toBe(true);

    await recordLearnerFeedback(learnerA, postId, "more_like_this");
  });

  it("does not reverse an explicit hide when positive feedback is recorded", async () => {
    const learnerId = "feedback-hidden-learner";
    const postId = (await getFeedData({ learnerId })).posts[0].id;

    await recordPostFeedEvent(learnerId, postId, "hidden");
    await recordLearnerFeedback(learnerId, postId, "more_like_this");

    expect((await getFeedData({ learnerId })).posts.some((post) => post.id === postId)).toBe(false);
  });
});
