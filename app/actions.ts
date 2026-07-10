"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAskTutorThreadFromQuestion } from "@/lib/ask-tutor-queries";
import { requireCurrentLearner } from "@/lib/auth/server";
import { recordPostFeedEvent, setPostSaved, setTutorFollow } from "@/lib/feed-queries";
import { addLearnerPostReaction, addLearnerPostReply, addLearnerQuoteTutorPost, saveLearnerPollVote } from "@/lib/social-texture-queries";

export async function askTutors(formData: FormData) {
  const learner = await requireCurrentLearner();
  const question = String(formData.get("question") ?? "").trim().slice(0, 2_000);
  if (!question) return;

  if (process.env.NODE_ENV === "development" && process.env.TWUTOR_DEMO_MODE === "true" && !process.env.DATABASE_URL) {
    redirect(`/replies?${new URLSearchParams({ question }).toString()}`);
  }

  const thread = await createAskTutorThreadFromQuestion(question, learner.id);
  revalidatePath("/replies");
  redirect(`/replies?thread=${thread.id}`);
}

export async function toggleTutorFollow(formData: FormData) {
  const learner = await requireCurrentLearner();
  const tutorId = String(formData.get("tutorId") ?? "");
  const follow = String(formData.get("follow") ?? "false") === "true";

  if (!tutorId) return;

  await setTutorFollow(learner.id, tutorId, follow);
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/tutors");
  revalidatePath(`/tutors/${tutorId}`);
}

export async function togglePostSaved(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");
  const saved = String(formData.get("saved") ?? "false") === "true";

  if (!postId) return;

  await setPostSaved(learner.id, postId, saved);
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/tutors");
}

export async function recordPostOpened(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return;

  await recordPostFeedEvent(learner.id, postId, "opened", { surface: "feed", interaction: "open" });
  revalidatePath("/");
}

export async function recordPostHidden(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return;

  await recordPostFeedEvent(learner.id, postId, "hidden", { surface: "feed", interaction: "hide" });
  revalidatePath("/");
}

export async function replyToPost(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "I would inspect retrieved context first.");

  if (!postId) return;

  await addLearnerPostReply({ learnerId: learner.id, postId, body });
  revalidatePath("/");
}

export async function reactToPost(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");
  const reactionType = String(formData.get("reactionType") ?? "check");

  if (!postId || (reactionType !== "check" && reactionType !== "repost")) return;

  await addLearnerPostReaction({ learnerId: learner.id, postId, reactionType });
  revalidatePath("/");
}

export async function voteOnPoll(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");
  const optionPosition = Number(formData.get("optionPosition") ?? 0);

  if (!postId || !Number.isInteger(optionPosition)) return;

  await saveLearnerPollVote({ learnerId: learner.id, postId, optionPosition });
  revalidatePath("/");
}

export async function quoteTutorPost(formData: FormData) {
  const learner = await requireCurrentLearner();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "Quoting this tutor thread for review.");

  if (!postId) return;

  await addLearnerQuoteTutorPost({ learnerId: learner.id, postId, body });
  revalidatePath("/");
}
