import type { Post } from "@/data/twutor";

export type SocialReactionType = "repost" | "check";

export type SocialReply = {
  id: string;
  learnerId: string;
  postId: string;
  body: string;
};

export type SocialReaction = {
  id: string;
  learnerId: string;
  postId: string;
  reactionType: SocialReactionType;
};

export type SocialPollVote = {
  learnerId: string;
  postId: string;
  optionPosition: number;
};

export type SocialQuotePost = {
  id: string;
  learnerId: string;
  postId: string;
  body: string;
};

export type SocialNotification = {
  id: string;
  learnerId: string;
  postId: string;
  label: string;
};

export type SocialTextureState = {
  replies: SocialReply[];
  reactions: SocialReaction[];
  pollVotes: SocialPollVote[];
  quotePosts: SocialQuotePost[];
  notifications: SocialNotification[];
};

export type SocialPostMetrics = {
  replies: number;
  reposts: number;
  checks: number;
  pollVotes: number;
  quotePosts: number;
};

export type SocialActivitySummary = {
  metricsByPostId: Record<string, SocialPostMetrics>;
  notifications: SocialNotification[];
  quotePosts: SocialQuotePost[];
  trendingConfusions: [string, string][];
};

export function createSocialTextureState(): SocialTextureState {
  return { replies: [], reactions: [], pollVotes: [], quotePosts: [], notifications: [] };
}

function notificationId(kind: string, id: string) {
  return `${kind}:${id}`;
}

export function recordPostReply(
  state: SocialTextureState,
  { learnerId, postId, body, id }: { learnerId: string; postId: string; body: string; id: string }
): SocialTextureState {
  const trimmed = body.trim();
  if (!trimmed) return state;

  return {
    ...state,
    replies: [...state.replies, { id, learnerId, postId, body: trimmed }],
    notifications: [
      ...state.notifications,
      { id: notificationId("reply", id), learnerId, postId, label: "Your reply joined a tutor thread" }
    ]
  };
}

export function recordPostReaction(
  state: SocialTextureState,
  { learnerId, postId, reactionType, id }: { learnerId: string; postId: string; reactionType: SocialReactionType; id: string }
): SocialTextureState {
  if (state.reactions.some((reaction) => reaction.learnerId === learnerId && reaction.postId === postId && reaction.reactionType === reactionType)) {
    return state;
  }

  return {
    ...state,
    reactions: [...state.reactions, { id, learnerId, postId, reactionType }],
    notifications: [
      ...state.notifications,
      {
        id: notificationId(reactionType, id),
        learnerId,
        postId,
        label: reactionType === "check" ? "You checked this model" : "You reposted a tutor signal"
      }
    ]
  };
}

export function recordPollVote(
  state: SocialTextureState,
  { learnerId, postId, optionPosition }: SocialPollVote
): SocialTextureState {
  const notification = { id: notificationId("poll", `${learnerId}:${postId}`), learnerId, postId, label: "Your poll vote was saved" };
  const nextVotes = [
    ...state.pollVotes.filter((vote) => !(vote.learnerId === learnerId && vote.postId === postId)),
    { learnerId, postId, optionPosition }
  ];

  return {
    ...state,
    pollVotes: nextVotes,
    notifications: [...state.notifications.filter((existing) => existing.id !== notification.id), notification]
  };
}

export function recordQuoteTutorPost(
  state: SocialTextureState,
  { learnerId, postId, body, id }: { learnerId: string; postId: string; body: string; id: string }
): SocialTextureState {
  const trimmed = body.trim();
  if (!trimmed) return state;

  return {
    ...state,
    quotePosts: [...state.quotePosts, { id, learnerId, postId, body: trimmed }],
    notifications: [
      ...state.notifications,
      { id: notificationId("quote", id), learnerId, postId, label: "Your quote-tutor post is ready" }
    ]
  };
}

function countForPost(state: SocialTextureState, postId: string): SocialPostMetrics {
  return {
    replies: state.replies.filter((reply) => reply.postId === postId).length,
    reposts: state.reactions.filter((reaction) => reaction.postId === postId && reaction.reactionType === "repost").length,
    checks: state.reactions.filter((reaction) => reaction.postId === postId && reaction.reactionType === "check").length,
    pollVotes: state.pollVotes.filter((vote) => vote.postId === postId).length,
    quotePosts: state.quotePosts.filter((quote) => quote.postId === postId).length
  };
}

function labelCount(count: number) {
  return `${count} ${count === 1 ? "learner" : "learners"}`;
}

function distinctLearnerCountForPost(state: SocialTextureState, postId: string) {
  return new Set([
    ...state.replies.filter((reply) => reply.postId === postId).map((reply) => reply.learnerId),
    ...state.reactions.filter((reaction) => reaction.postId === postId).map((reaction) => reaction.learnerId),
    ...state.pollVotes.filter((vote) => vote.postId === postId).map((vote) => vote.learnerId),
    ...state.quotePosts.filter((quote) => quote.postId === postId).map((quote) => quote.learnerId)
  ]).size;
}

export function buildSocialActivitySummary(state: SocialTextureState, posts: Pick<Post, "id" | "body">[]): SocialActivitySummary {
  const metricsByPostId = Object.fromEntries(posts.map((post) => [post.id, countForPost(state, post.id)]));
  const activePosts = posts
    .map((post) => ({ post, metrics: metricsByPostId[post.id] }))
    .map(({ post, metrics }) => ({ post, score: metrics.replies + metrics.reposts + metrics.checks + metrics.pollVotes + metrics.quotePosts }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    metricsByPostId,
    notifications: state.notifications,
    quotePosts: state.quotePosts,
    trendingConfusions: activePosts.map(({ post }) => [labelCount(distinctLearnerCountForPost(state, post.id)), post.body.split("\n")[0]] as [string, string])
  };
}
