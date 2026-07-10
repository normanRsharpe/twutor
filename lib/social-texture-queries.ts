import { randomUUID } from "node:crypto";
import type { Post } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { socialNotifications, socialPollVotes, socialQuotePosts, socialReactions, socialReplies } from "@/lib/db/schema";
import {
  buildSocialActivitySummary,
  createSocialTextureState,
  createSocialTextureStateFromRows,
  recordPollVote,
  recordPostReaction,
  recordPostReply,
  recordQuoteTutorPost,
  type SocialActivitySummary,
  type SocialReactionType,
  type SocialTextureState
} from "@/lib/social-texture";

let fallbackSocialState: SocialTextureState = createSocialTextureState();

export function resetFallbackSocialTextureState() {
  fallbackSocialState = createSocialTextureState();
}

export function getFallbackSocialTextureState() {
  return fallbackSocialState;
}

async function getDurableSocialTextureState(): Promise<SocialTextureState> {
  const db = getDb();
  const [replies, reactions, pollVotes, quotePosts, notifications] = await Promise.all([
    db.select().from(socialReplies),
    db.select().from(socialReactions),
    db.select().from(socialPollVotes),
    db.select().from(socialQuotePosts),
    db.select().from(socialNotifications)
  ]);

  return createSocialTextureStateFromRows({
    replies: replies.map(({ id, learnerId, postId, body }) => ({ id, learnerId, postId, body })),
    reactions: reactions.map(({ id, learnerId, postId, reactionType }) => ({ id, learnerId, postId, reactionType: reactionType as SocialReactionType })),
    pollVotes: pollVotes.map(({ learnerId, postId, optionPosition }) => ({ learnerId, postId, optionPosition })),
    quotePosts: quotePosts.map(({ id, learnerId, postId, body }) => ({ id, learnerId, postId, body })),
    notifications: notifications.map(({ id, learnerId, postId, label }) => ({ id, learnerId, postId, label }))
  });
}

export async function getSocialActivitySummary(posts: Pick<Post, "id" | "body">[], learnerId: string): Promise<SocialActivitySummary> {
  const state = getDatabaseUrl() ? await getDurableSocialTextureState() : fallbackSocialState;
  return buildSocialActivitySummary(state, posts, learnerId);
}

async function saveNotification({ id, learnerId, postId, label }: { id: string; learnerId: string; postId: string; label: string }) {
  await getDb()
    .insert(socialNotifications)
    .values({ id, learnerId, postId, label })
    .onConflictDoUpdate({ target: socialNotifications.id, set: { label } });
}

export async function addLearnerPostReply({ learnerId, postId, body }: { learnerId: string; postId: string; body: string }) {
  if (!getDatabaseUrl()) {
    fallbackSocialState = recordPostReply(fallbackSocialState, { id: randomUUID(), learnerId, postId, body });
    return;
  }

  const trimmed = body.trim();
  if (!trimmed) return;
  const id = randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(socialReplies).values({ id, learnerId, postId, body: trimmed });
    await tx.insert(socialNotifications).values({ id: `reply:${id}`, learnerId, postId, label: "Your reply joined a tutor thread" });
  });
}

export async function addLearnerPostReaction({ learnerId, postId, reactionType }: { learnerId: string; postId: string; reactionType: SocialReactionType }) {
  if (!getDatabaseUrl()) {
    fallbackSocialState = recordPostReaction(fallbackSocialState, { id: randomUUID(), learnerId, postId, reactionType });
    return;
  }

  const id = randomUUID();
  const inserted = await getDb()
    .insert(socialReactions)
    .values({ id, learnerId, postId, reactionType })
    .onConflictDoNothing()
    .returning({ id: socialReactions.id });
  if (!inserted.length) return;
  await saveNotification({
    id: `${reactionType}:${id}`,
    learnerId,
    postId,
    label: reactionType === "check" ? "You checked this model" : "You reposted a tutor signal"
  });
}

export async function saveLearnerPollVote({ learnerId, postId, optionPosition }: { learnerId: string; postId: string; optionPosition: number }) {
  if (!getDatabaseUrl()) {
    fallbackSocialState = recordPollVote(fallbackSocialState, { learnerId, postId, optionPosition });
    return;
  }

  await getDb().transaction(async (tx) => {
    await tx
      .insert(socialPollVotes)
      .values({ learnerId, postId, optionPosition })
      .onConflictDoUpdate({ target: [socialPollVotes.learnerId, socialPollVotes.postId], set: { optionPosition, updatedAt: new Date() } });
    await tx
      .insert(socialNotifications)
      .values({ id: `poll:${learnerId}:${postId}`, learnerId, postId, label: "Your poll vote was saved" })
      .onConflictDoUpdate({ target: socialNotifications.id, set: { label: "Your poll vote was saved" } });
  });
}

export async function addLearnerQuoteTutorPost({ learnerId, postId, body }: { learnerId: string; postId: string; body: string }) {
  if (!getDatabaseUrl()) {
    fallbackSocialState = recordQuoteTutorPost(fallbackSocialState, { id: randomUUID(), learnerId, postId, body });
    return;
  }

  const trimmed = body.trim();
  if (!trimmed) return;
  const id = randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.insert(socialQuotePosts).values({ id, learnerId, postId, body: trimmed });
    await tx.insert(socialNotifications).values({ id: `quote:${id}`, learnerId, postId, label: "Your quote-tutor post is ready" });
  });
}
