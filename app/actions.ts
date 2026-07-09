"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAskTutorThreadFromQuestion } from "@/lib/ask-tutor-queries";
import { recordPostFeedEvent, setPostSaved, setTutorFollow } from "@/lib/feed-queries";
import { addLearnerPostReaction, addLearnerPostReply, addLearnerQuoteTutorPost, saveLearnerPollVote } from "@/lib/social-texture-queries";

export async function askTutors(formData: FormData) {
  const question = String(formData.get("question") ?? "");
  if (!question.trim()) return;

  const thread = await createAskTutorThreadFromQuestion(question);
  revalidatePath("/replies");
  redirect(`/replies?thread=${thread.id}`);
}

export async function toggleTutorFollow(formData: FormData) {
  const tutorId = String(formData.get("tutorId") ?? "");
  const follow = String(formData.get("follow") ?? "false") === "true";

  if (!tutorId) return;

  await setTutorFollow(tutorId, follow);
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/tutors");
  revalidatePath(`/tutors/${tutorId}`);
}

export async function togglePostSaved(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const saved = String(formData.get("saved") ?? "false") === "true";

  if (!postId) return;

  await setPostSaved(postId, saved);
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/tutors");
}

export async function recordPostOpened(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return;

  await recordPostFeedEvent(postId, "opened", { surface: "feed", interaction: "open" });
  revalidatePath("/");
}

export async function recordPostHidden(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return;

  await recordPostFeedEvent(postId, "hidden", { surface: "feed", interaction: "hide" });
  revalidatePath("/");
}

export async function replyToPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "I would inspect retrieved context first.");

  if (!postId) return;

  await addLearnerPostReply({ postId, body });
  revalidatePath("/");
}

export async function reactToPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const reactionType = String(formData.get("reactionType") ?? "check");

  if (!postId || (reactionType !== "check" && reactionType !== "repost")) return;

  await addLearnerPostReaction({ postId, reactionType });
  revalidatePath("/");
}

export async function voteOnPoll(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const optionPosition = Number(formData.get("optionPosition") ?? 0);

  if (!postId || !Number.isInteger(optionPosition)) return;

  await saveLearnerPollVote({ postId, optionPosition });
  revalidatePath("/");
}

export async function quoteTutorPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "Quoting this tutor thread for review.");

  if (!postId) return;

  await addLearnerQuoteTutorPost({ postId, body });
  revalidatePath("/");
}
