import { describe, expect, it } from "vitest";
import { buildSocialActivitySummary, createSocialTextureState, createSocialTextureStateFromRows, recordPostReply } from "@/lib/social-texture";

describe("learner isolation", () => {
  it("keeps private social activity out of another learner's feed summary", () => {
    let state = createSocialTextureState();
    state = recordPostReply(state, { id: "ada-reply", learnerId: "ada", postId: "post-1", body: "Ada's private reply" });
    state = recordPostReply(state, { id: "grace-reply", learnerId: "grace", postId: "post-1", body: "Grace's private reply" });

    const summary = buildSocialActivitySummary(state, [{ id: "post-1", body: "A tutor post" }], "ada");

    expect(summary.metricsByPostId["post-1"].replies).toBe(2);
    expect(summary.notifications).toEqual([expect.objectContaining({ learnerId: "ada", postId: "post-1" })]);
    expect(summary.quotePosts).toEqual([]);
  });

  it("reconstructs a learner-scoped social state from durable rows", () => {
    const state = createSocialTextureStateFromRows({
      replies: [{ id: "reply-1", learnerId: "ada", postId: "post-1", body: "A durable reply" }],
      reactions: [{ id: "reaction-1", learnerId: "grace", postId: "post-1", reactionType: "check" }],
      pollVotes: [{ learnerId: "ada", postId: "post-1", optionPosition: 2 }],
      quotePosts: [{ id: "quote-1", learnerId: "ada", postId: "post-1", body: "A private quote" }],
      notifications: [{ id: "quote:quote-1", learnerId: "ada", postId: "post-1", label: "Your quote-tutor post is ready" }]
    });

    const summary = buildSocialActivitySummary(state, [{ id: "post-1", body: "A tutor post" }], "ada");
    expect(summary.metricsByPostId["post-1"]).toMatchObject({ replies: 1, checks: 1, pollVotes: 1, quotePosts: 1 });
    expect(summary.quotePosts).toEqual([expect.objectContaining({ id: "quote-1", learnerId: "ada" })]);
  });
});
