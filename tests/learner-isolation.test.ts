import { describe, expect, it } from "vitest";
import { buildSocialActivitySummary, createSocialTextureState, recordPostReply } from "@/lib/social-texture";

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
});
