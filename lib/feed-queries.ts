import { and, asc, eq } from "drizzle-orm";
import type { Post, Tutor, TutorId } from "@/data/twutor";
import { posts as seedPosts, tutors as seedTutors } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import {
  challenges,
  diagramNodes,
  generatedAssets,
  pollOptions,
  postMetrics,
  posts,
  quotePosts,
  traceCards,
  tutorFollows,
  tutors
} from "@/lib/db/schema";
import { buildSeedRows, demoLearnerId, type SeedRows } from "@/lib/seed-data";

export type TutorView = Tutor & {
  bio: string;
  specialtyTags: string[];
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

export type FeedData = {
  tutors: Record<TutorId, TutorView>;
  posts: FeedPost[];
  tutorsToFollow: TutorId[];
};

function byPostId<T extends { postId: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.postId] ??= [];
    acc[row.postId].push(row);
    return acc;
  }, {});
}

export function assembleFeedPosts(rows: Pick<SeedRows, "posts" | "postMetrics" | "diagramNodes" | "quotePosts" | "pollOptions" | "traceCards" | "challenges">): FeedPost[] {
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

function fallbackFeedData(tutorId?: string): FeedData {
  const seed = buildSeedRows({ tutors: seedTutors, posts: seedPosts });
  const followed = new Set(seed.follows.map((follow) => follow.tutorId));
  const assets = new Map(seed.generatedAssets.map((asset) => [asset.ownerId, asset]));
  const tutorViews = Object.fromEntries(
    seed.tutors.map((tutor) => {
      const asset = assets.get(tutor.id);
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
          isVerified: tutor.isVerified ?? true,
          isFollowed: followed.has(tutor.id),
          generatedAvatar: asset
            ? { provider: asset.provider, model: asset.model ?? null, prompt: asset.prompt, url: asset.url }
            : undefined
        }
      ];
    })
  ) as Record<TutorId, TutorView>;

  const feedPosts = assembleFeedPosts(seed).filter((post) => !tutorId || post.tutorId === tutorId);
  return {
    tutors: tutorViews,
    posts: feedPosts,
    tutorsToFollow: (Object.keys(tutorViews) as TutorId[]).filter((id) => !tutorViews[id].isFollowed).slice(0, 2)
  };
}

export async function getFeedData({ tutorId }: { tutorId?: string } = {}): Promise<FeedData> {
  if (!getDatabaseUrl()) return fallbackFeedData(tutorId);

  const db = getDb();
  const [tutorRows, followRows, assetRows, postRows, metricRows, diagramRows, quoteRows, pollRows, traceRows, challengeRows] = await Promise.all([
    db.select().from(tutors).orderBy(asc(tutors.name)),
    db.select().from(tutorFollows).where(eq(tutorFollows.learnerId, demoLearnerId)),
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

  const followed = new Set(followRows.map((follow) => follow.tutorId));
  const assets = new Map(assetRows.map((asset) => [asset.ownerId, asset]));
  const tutorViews = Object.fromEntries(
    tutorRows.map((tutor) => {
      const asset = assets.get(tutor.id);
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
          isVerified: tutor.isVerified,
          isFollowed: followed.has(tutor.id),
          generatedAvatar: asset
            ? { provider: asset.provider, model: asset.model, prompt: asset.prompt, url: asset.url }
            : undefined
        }
      ];
    })
  ) as Record<TutorId, TutorView>;

  return {
    tutors: tutorViews,
    posts: assembleFeedPosts(seedLike),
    tutorsToFollow: (Object.keys(tutorViews) as TutorId[]).filter((id) => !tutorViews[id].isFollowed).slice(0, 2)
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
