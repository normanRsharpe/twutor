import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { assembleFeedPosts, filterPostsForFeed } from "@/lib/feed-queries";
import { buildSeedRows, demoLearnerId } from "@/lib/seed-data";

describe("learner saved-post memory", () => {
  it("seeds native saved posts for the demo learner", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.savedPosts).toEqual([
      expect.objectContaining({ learnerId: demoLearnerId, postId: "evals-after-bug" }),
      expect.objectContaining({ learnerId: demoLearnerId, postId: "model-gateway" })
    ]);
  });

  it("marks saved posts while assembling the feed", () => {
    const rows = buildSeedRows({ tutors, posts });
    const feed = assembleFeedPosts(rows, new Set(rows.savedPosts.map((saved) => saved.postId)));

    expect(feed.find((post) => post.id === "evals-after-bug")?.isSaved).toBe(true);
    expect(feed.find((post) => post.id === "rag-poll")?.isSaved).toBe(false);
  });

  it("filters hidden posts from every learner feed", () => {
    const rows = buildSeedRows({ tutors, posts });
    const feed = assembleFeedPosts(rows);

    expect(filterPostsForFeed(feed, "for-you", new Set(), new Set(["rag-poll"])).map((post) => post.id)).not.toContain("rag-poll");
    expect(filterPostsForFeed(feed, "following", new Set(["eval"]), new Set(["evals-after-bug"])).map((post) => post.id)).not.toContain("evals-after-bug");
  });

  it("filters the saved feed to saved posts only", () => {
    const rows = buildSeedRows({ tutors, posts });
    const feed = assembleFeedPosts(rows, new Set(rows.savedPosts.map((saved) => saved.postId)));

    expect(filterPostsForFeed(feed, "saved", new Set())).toHaveLength(2);
    expect(filterPostsForFeed(feed, "saved", new Set()).map((post) => post.id)).toEqual(["evals-after-bug", "model-gateway"]);
  });
});
