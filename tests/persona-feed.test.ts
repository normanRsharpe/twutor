import { describe, expect, it } from "vitest";
import { posts, tutors, type TutorId } from "@/data/twutor";
import { assembleTutorViews, filterPostsForFeed, getLatestPostByTutor } from "@/lib/feed-queries";
import { buildSeedRows } from "@/lib/seed-data";

describe("tutor persona metadata", () => {
  it("seeds every tutor with profile promise, teaching style, voice guide, accent, and pinned post", () => {
    const rows = buildSeedRows({ tutors, posts });
    const evalTutor = rows.tutors.find((tutor) => tutor.id === "eval");

    expect(evalTutor).toEqual(
      expect.objectContaining({
        profileHeadline: "Evals are CI/CD for AI systems.",
        teachingStyle: "Sharp, skeptical, test-first.",
        bestFor: "Turning vague AI quality worries into concrete release gates.",
        accentColor: "#38bdf8",
        pinnedPostId: "evals-after-bug"
      })
    );
    expect(evalTutor?.voicePrinciples).toEqual(expect.arrayContaining(["Prefer tiny eval suites over vibe checks"]));
    expect(evalTutor?.preferredPostFormats).toEqual(expect.arrayContaining(["hot take", "release gate teardown"]));
  });
});

describe("feed filters", () => {
  it("filters the Following feed to posts by followed tutors only", () => {
    const filtered = filterPostsForFeed(posts, "following", new Set<TutorId>(["eval", "maya"]));

    expect(filtered.map((post) => post.tutorId)).toEqual(["eval", "maya"]);
  });

  it("keeps For You as the full social learning feed", () => {
    expect(filterPostsForFeed(posts, "for-you", new Set<TutorId>(["eval"]))).toHaveLength(posts.length);
  });
});

describe("tutor directory view model", () => {
  it("attaches latest post previews to every tutor card", () => {
    const seed = buildSeedRows({ tutors, posts });
    const views = assembleTutorViews(seed.tutors, seed.follows, seed.generatedAssets, seed.posts);
    const latestByTutor = getLatestPostByTutor(posts);

    expect(views.eval.latestPostPreview).toBe(latestByTutor.eval?.body);
    expect(views.maya.latestPostPreview).toBe("The model gateway is the new API gateway. Not because LLMs are magical — because every team is about to reinvent the same cross-cutting mess.");
  });
});
