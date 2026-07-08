import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import { buildSeedRows } from "@/lib/seed-data";
import { assembleFeedPosts } from "@/lib/feed-queries";

describe("Twutor database seed model", () => {
  it("preserves every current tutor and generated avatar metadata", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.tutors).toHaveLength(Object.keys(tutors).length);
    expect(rows.generatedAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerType: "tutor", ownerId: "eval", provider: "openai", url: "/assets/avatars/openai/eval-singh.png" })
      ])
    );
  });

  it("expands current feed posts into relational post type rows", () => {
    const rows = buildSeedRows({ tutors, posts });

    expect(rows.posts.map((post) => post.kind)).toEqual(["text", "diagram", "quote", "poll", "trace", "challenge"]);
    expect(rows.diagramNodes.filter((node) => node.postId === "model-gateway")).toHaveLength(5);
    expect(rows.pollOptions.filter((option) => option.postId === "rag-poll")).toHaveLength(4);
    expect(rows.challenges).toEqual([
      expect.objectContaining({ postId: "gateway-challenge", title: "Build a fake model gateway trace viewer." })
    ]);
  });
});

describe("feed assembly", () => {
  it("reconstructs feed posts with all attachment types from database-style rows", () => {
    const seed = buildSeedRows({ tutors, posts });
    const feed = assembleFeedPosts(seed);

    expect(feed).toHaveLength(6);
    expect(feed.find((post) => post.id === "model-gateway")?.diagram?.nodes).toEqual([
      "request",
      "policy",
      "route model",
      "tool sandbox",
      "trace + eval sample"
    ]);
    expect(feed.find((post) => post.id === "retrieval-first")?.quote?.tutorId).toBe("theo");
    expect(feed.find((post) => post.id === "rag-poll")?.poll?.[0]).toEqual({ label: "Retrieved context", percent: 61 });
    expect(feed.find((post) => post.id === "ai-trace")?.trace?.trace_id).toBe("tw_8f31");
    expect(feed.find((post) => post.id === "gateway-challenge")?.challenge?.cta).toBe("Start challenge");
  });
});
