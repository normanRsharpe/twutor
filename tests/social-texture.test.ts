import { describe, expect, it } from "vitest";
import { posts } from "@/data/twutor";
import {
  buildSocialActivitySummary,
  createSocialTextureState,
  recordPollVote,
  recordPostReaction,
  recordPostReply,
  recordQuoteTutorPost
} from "@/lib/social-texture";
import { demoLearnerId } from "@/lib/seed-data";

describe("social texture", () => {
  it("persists replies, reposts, checks, poll votes, notifications, and activity-backed confusions", () => {
    let state = createSocialTextureState();

    state = recordPostReply(state, { learnerId: demoLearnerId, postId: "rag-poll", body: "I would inspect retrieved context first.", id: "reply-1" });
    state = recordPostReaction(state, { learnerId: demoLearnerId, postId: "rag-poll", reactionType: "check", id: "check-1" });
    state = recordPostReaction(state, { learnerId: demoLearnerId, postId: "rag-poll", reactionType: "repost", id: "repost-1" });
    state = recordPollVote(state, { learnerId: demoLearnerId, postId: "rag-poll", optionPosition: 0 });
    state = recordQuoteTutorPost(state, { learnerId: demoLearnerId, postId: "rag-poll", body: "Quoting this tutor thread for review.", id: "quote-1" });

    const summary = buildSocialActivitySummary(state, posts);

    expect(summary.metricsByPostId["rag-poll"]).toMatchObject({ replies: 1, reposts: 1, checks: 1, pollVotes: 1, quotePosts: 1 });
    expect(summary.notifications).toEqual([
      expect.objectContaining({ postId: "rag-poll", label: "Your reply joined a tutor thread" }),
      expect.objectContaining({ postId: "rag-poll", label: "You checked this model" }),
      expect.objectContaining({ postId: "rag-poll", label: "You reposted a tutor signal" }),
      expect.objectContaining({ postId: "rag-poll", label: "Your poll vote was saved" }),
      expect.objectContaining({ postId: "rag-poll", label: "Your quote-tutor post is ready" })
    ]);
    expect(summary.quotePosts[0]).toMatchObject({ postId: "rag-poll", body: "Quoting this tutor thread for review." });
    expect(summary.trendingConfusions[0]).toEqual(["1 learner", "Poll: your RAG bot is hallucinating. What do you check first?"]);
  });
});
