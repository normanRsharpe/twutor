import { randomUUID } from "node:crypto";
import type { Post } from "@/data/twutor";
import {
  buildSocialActivitySummary,
  createSocialTextureState,
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

export function getSocialActivitySummary(posts: Pick<Post, "id" | "body">[], learnerId: string): SocialActivitySummary {
  return buildSocialActivitySummary(fallbackSocialState, posts, learnerId);
}

export async function addLearnerPostReply({ learnerId, postId, body }: { learnerId: string; postId: string; body: string }) {
  fallbackSocialState = recordPostReply(fallbackSocialState, { id: randomUUID(), learnerId, postId, body });
}

export async function addLearnerPostReaction({ learnerId, postId, reactionType }: { learnerId: string; postId: string; reactionType: SocialReactionType }) {
  fallbackSocialState = recordPostReaction(fallbackSocialState, { id: randomUUID(), learnerId, postId, reactionType });
}

export async function saveLearnerPollVote({ learnerId, postId, optionPosition }: { learnerId: string; postId: string; optionPosition: number }) {
  fallbackSocialState = recordPollVote(fallbackSocialState, { learnerId, postId, optionPosition });
}

export async function addLearnerQuoteTutorPost({ learnerId, postId, body }: { learnerId: string; postId: string; body: string }) {
  fallbackSocialState = recordQuoteTutorPost(fallbackSocialState, { id: randomUUID(), learnerId, postId, body });
}
