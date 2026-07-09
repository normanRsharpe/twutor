import { randomUUID } from "node:crypto";
import type { Post } from "@/data/twutor";
import { demoLearnerId } from "@/lib/seed-data";
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

export function getSocialActivitySummary(posts: Pick<Post, "id" | "body">[]): SocialActivitySummary {
  return buildSocialActivitySummary(fallbackSocialState, posts);
}

export async function addLearnerPostReply({ postId, body }: { postId: string; body: string }) {
  fallbackSocialState = recordPostReply(fallbackSocialState, {
    id: randomUUID(),
    learnerId: demoLearnerId,
    postId,
    body
  });
}

export async function addLearnerPostReaction({ postId, reactionType }: { postId: string; reactionType: SocialReactionType }) {
  fallbackSocialState = recordPostReaction(fallbackSocialState, {
    id: randomUUID(),
    learnerId: demoLearnerId,
    postId,
    reactionType
  });
}

export async function saveLearnerPollVote({ postId, optionPosition }: { postId: string; optionPosition: number }) {
  fallbackSocialState = recordPollVote(fallbackSocialState, {
    learnerId: demoLearnerId,
    postId,
    optionPosition
  });
}

export async function addLearnerQuoteTutorPost({ postId, body }: { postId: string; body: string }) {
  fallbackSocialState = recordQuoteTutorPost(fallbackSocialState, {
    id: randomUUID(),
    learnerId: demoLearnerId,
    postId,
    body
  });
}
