import { and, asc, eq } from "drizzle-orm";
import type { Post, Tutor, TutorId } from "@/data/twutor";
import { posts as seedPosts, tutors as seedTutors } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import {
  challenges,
  diagramNodes,
  generatedAssets,
  learnerLearningStates,
  learnerSavedPosts,
  pollOptions,
  postMetrics,
  posts,
  quotePosts,
  traceCards,
  tutorFollows,
  tutors
} from "@/lib/db/schema";
import { buildSeedRows, demoLearnerId, type SeedRows } from "@/lib/seed-data";

export type FeedKind = "for-you" | "following" | "saved";

export type TutorView = Tutor & {
  bio: string;
  specialtyTags: string[];
  profileHeadline: string;
  teachingStyle: string;
  bestFor: string;
  accentColor: string;
  pinnedPostId: string | null;
  voicePrinciples: string[];
  preferredPostFormats: string[];
  latestPostPreview?: string;
  isVerified: boolean;
  isFollowed: boolean;
  generatedAvatar?: {
    provider: string;
    model: string | null;
    prompt: string;
    url: string;
  };
};

export type FeedPost = Post;

export type LearningArc = {
  title: string;
  currentArc: string;
  progressPercent: number;
  savedPostCount: number;
  focusTopics: string[];
  lastSignal: string;
};

export type FeedData = {
  tutors: Record<TutorId, TutorView>;
  posts: FeedPost[];
  tutorsToFollow: TutorId[];
  activeFeed: FeedKind;
  learningArc: LearningArc;
};

function byPostId<T extends { postId: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.postId] ??= [];
    acc[row.postId].push(row);
    return acc;
  }, {});
}

export function getLatestPostByTutor(feedPosts: Pick<Post, "tutorId" | "body">[]) {
  return feedPosts.reduce<Partial<Record<TutorId, Pick<Post, "body">>>>((acc, post) => {
    acc[post.tutorId] ??= post;
    return acc;
  }, {});
}

export function filterPostsForFeed(feedPosts: FeedPost[], feed: FeedKind, followedTutorIds: Set<TutorId>) {
  if (feed === "following") return feedPosts.filter((post) => followedTutorIds.has(post.tutorId));
  if (feed === "saved") return feedPosts.filter((post) => post.isSaved);
  return feedPosts;
}

export function assembleLearningArc(state: SeedRows["learningStates"][number] | undefined, savedPostCount: number): LearningArc {
  return {
    title: state?.title ?? "Platform × AI Engineering",
    currentArc: state?.currentArc ?? "AI systems as platform problems",
    progressPercent: state?.progressPercent ?? 0,
    savedPostCount,
    focusTopics: state?.focusTopics ?? [],
    lastSignal: state?.lastSignal ?? "No signal yet"
  };
}

export function assembleFeedPosts(rows: Pick<SeedRows, "posts" | "postMetrics" | "diagramNodes" | "quotePosts" | "pollOptions" | "traceCards" | "challenges">, savedPostIds = new Set<string>()): FeedPost[] {
  const metricsByPost = new Map(rows.postMetrics.map((metric) => [metric.postId, metric]));
  const quoteByPost = new Map(rows.quotePosts.map((quote) => [quote.postId, quote]));
  const traceByPost = new Map(rows.traceCards.map((trace) => [trace.postId, trace]));
  const challengeByPost = new Map(rows.challenges.map((challenge) => [challenge.postId, challenge]));
  const diagramsByPost = byPostId(rows.diagramNodes);
  const pollsByPost = byPostId(rows.pollOptions);

  return [...rows.posts]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((post) => {
      const metrics = metricsByPost.get(post.id);
      if (!metrics) throw new Error(`Missing metrics for ${post.id}`);

      const diagramRows = diagramsByPost[post.id]?.sort((a, b) => a.position - b.position);
      const pollRows = pollsByPost[post.id]?.sort((a, b) => a.position - b.position);
      const quote = quoteByPost.get(post.id);
      const trace = traceByPost.get(post.id);
      const challenge = challengeByPost.get(post.id);

      return {
        id: post.id,
        tutorId: post.tutorId as TutorId,
        time: post.timeLabel,
        body: post.body,
        metrics: {
          replies: metrics.replies,
          reposts: metrics.reposts,
          checks: metrics.checks,
          views: metrics.views
        },
        isSaved: savedPostIds.has(post.id),
        ...(diagramRows?.length
          ? { diagram: { nodes: diagramRows.map((node) => node.label), caption: diagramRows[0].caption } }
          : {}),
        ...(quote ? { quote: { tutorId: quote.tutorId as TutorId, time: quote.timeLabel, body: quote.body } } : {}),
        ...(pollRows?.length ? { poll: pollRows.map((option) => ({ label: option.label, percent: option.percent })) } : {}),
        ...(trace ? { trace: trace.payload } : {}),
        ...(challenge ? { challenge: { title: challenge.title, body: challenge.body, cta: challenge.cta } } : {})
      };
    });
}

export function assembleTutorViews(
  tutorRows: SeedRows["tutors"],
  followRows: SeedRows["follows"],
  assetRows: SeedRows["generatedAssets"],
  postRows: Pick<SeedRows["posts"][number], "tutorId" | "body" | "sortOrder">[]
): Record<TutorId, TutorView> {
  const followed = new Set(followRows.map((follow) => follow.tutorId));
  const assets = new Map(assetRows.map((asset) => [asset.ownerId, asset]));
  const defaultTutors = new Map(buildSeedRows({ tutors: seedTutors, posts: seedPosts }).tutors.map((tutor) => [tutor.id, tutor]));
  const latestByTutor = [...postRows]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .reduce<Record<string, string>>((acc, post) => {
      acc[post.tutorId] ??= post.body;
      return acc;
    }, {});

  return Object.fromEntries(
    tutorRows.map((tutor) => {
      const asset = assets.get(tutor.id);
      const fallback = defaultTutors.get(tutor.id);
      return [
        tutor.id,
        {
          id: tutor.id as TutorId,
          name: tutor.name,
          handle: tutor.handle,
          avatar: tutor.avatarUrl,
          angle: tutor.angle,
          bio: tutor.bio,
          specialtyTags: tutor.specialtyTags,
          profileHeadline: tutor.profileHeadline || fallback?.profileHeadline || tutor.angle,
          teachingStyle: tutor.teachingStyle || fallback?.teachingStyle || "Opinionated, practical, feed-native.",
          bestFor: tutor.bestFor || fallback?.bestFor || tutor.bio,
          accentColor: tutor.accentColor || fallback?.accentColor || "#38bdf8",
          pinnedPostId: tutor.pinnedPostId || fallback?.pinnedPostId || null,
          voicePrinciples: tutor.voicePrinciples.length ? tutor.voicePrinciples : fallback?.voicePrinciples ?? [],
          preferredPostFormats: tutor.preferredPostFormats.length ? tutor.preferredPostFormats : fallback?.preferredPostFormats ?? [],
          latestPostPreview: latestByTutor[tutor.id],
          isVerified: tutor.isVerified ?? true,
          isFollowed: followed.has(tutor.id),
          generatedAvatar: asset
            ? { provider: asset.provider, model: asset.model ?? null, prompt: asset.prompt, url: asset.url }
            : undefined
        }
      ];
    })
  ) as Record<TutorId, TutorView>;
}

function fallbackFeedData({ tutorId, feed = "for-you" }: { tutorId?: string; feed?: FeedKind }): FeedData {
  const seed = buildSeedRows({ tutors: seedTutors, posts: seedPosts });
  const tutorViews = assembleTutorViews(seed.tutors, seed.follows, seed.generatedAssets, seed.posts);
  const followed = new Set((Object.keys(tutorViews) as TutorId[]).filter((id) => tutorViews[id].isFollowed));
  const feedPosts = assembleFeedPosts(seed, new Set(seed.savedPosts.map((saved) => saved.postId)));
  const visiblePosts = filterPostsForFeed(feedPosts, feed, followed).filter((post) => !tutorId || post.tutorId === tutorId);

  return {
    tutors: tutorViews,
    posts: visiblePosts,
    tutorsToFollow: (Object.keys(tutorViews) as TutorId[]).filter((id) => !tutorViews[id].isFollowed).slice(0, 2),
    activeFeed: feed,
    learningArc: assembleLearningArc(seed.learningStates[0], seed.savedPosts.length)
  };
}

export async function getFeedData({ tutorId, feed = "for-you" }: { tutorId?: string; feed?: FeedKind } = {}): Promise<FeedData> {
  if (!getDatabaseUrl()) return fallbackFeedData({ tutorId, feed });

  const db = getDb();
  const [tutorRows, followRows, savedRows, learningStateRows, assetRows, postRows, metricRows, diagramRows, quoteRows, pollRows, traceRows, challengeRows] = await Promise.all([
    db.select().from(tutors).orderBy(asc(tutors.name)),
    db.select().from(tutorFollows).where(eq(tutorFollows.learnerId, demoLearnerId)),
    db.select().from(learnerSavedPosts).where(eq(learnerSavedPosts.learnerId, demoLearnerId)),
    db.select().from(learnerLearningStates).where(eq(learnerLearningStates.learnerId, demoLearnerId)),
    db.select().from(generatedAssets).where(eq(generatedAssets.ownerType, "tutor")),
    tutorId
      ? db.select().from(posts).where(eq(posts.tutorId, tutorId)).orderBy(asc(posts.sortOrder))
      : db.select().from(posts).orderBy(asc(posts.sortOrder)),
    db.select().from(postMetrics),
    db.select().from(diagramNodes),
    db.select().from(quotePosts),
    db.select().from(pollOptions),
    db.select().from(traceCards),
    db.select().from(challenges)
  ]);

  const visiblePostIds = new Set(postRows.map((post) => post.id));
  const seedLike = {
    posts: postRows,
    postMetrics: metricRows.filter((row) => visiblePostIds.has(row.postId)),
    diagramNodes: diagramRows.filter((row) => visiblePostIds.has(row.postId)),
    quotePosts: quoteRows.filter((row) => visiblePostIds.has(row.postId)),
    pollOptions: pollRows.filter((row) => visiblePostIds.has(row.postId)),
    traceCards: traceRows.filter((row) => visiblePostIds.has(row.postId)),
    challenges: challengeRows.filter((row) => visiblePostIds.has(row.postId))
  };

  const tutorViews = assembleTutorViews(tutorRows, followRows, assetRows, postRows);
  const followed = new Set((Object.keys(tutorViews) as TutorId[]).filter((id) => tutorViews[id].isFollowed));

  return {
    tutors: tutorViews,
    posts: filterPostsForFeed(assembleFeedPosts(seedLike, new Set(savedRows.map((saved) => saved.postId))), feed, followed),
    tutorsToFollow: (Object.keys(tutorViews) as TutorId[]).filter((id) => !tutorViews[id].isFollowed).slice(0, 2),
    activeFeed: feed,
    learningArc: assembleLearningArc(learningStateRows[0], savedRows.length)
  };
}

export async function getTutorProfile(tutorId: string) {
  const feed = await getFeedData({ tutorId });
  return feed.tutors[tutorId as TutorId] ? feed : null;
}

export async function listTutorIds() {
  if (!getDatabaseUrl()) return Object.keys(seedTutors);
  const db = getDb();
  return (await db.select({ id: tutors.id }).from(tutors)).map((row) => row.id);
}

export async function setTutorFollow(tutorId: string, follow: boolean) {
  if (!getDatabaseUrl()) return;
  const db = getDb();
  if (follow) {
    await db.insert(tutorFollows).values({ learnerId: demoLearnerId, tutorId }).onConflictDoNothing();
  } else {
    await db.delete(tutorFollows).where(and(eq(tutorFollows.learnerId, demoLearnerId), eq(tutorFollows.tutorId, tutorId)));
  }
}

export async function setPostSaved(postId: string, saved: boolean) {
  if (!getDatabaseUrl()) return;
  const db = getDb();
  if (saved) {
    await db.insert(learnerSavedPosts).values({ learnerId: demoLearnerId, postId }).onConflictDoNothing();
  } else {
    await db.delete(learnerSavedPosts).where(and(eq(learnerSavedPosts.learnerId, demoLearnerId), eq(learnerSavedPosts.postId, postId)));
  }
}
