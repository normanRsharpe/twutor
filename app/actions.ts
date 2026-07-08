"use server";

import { revalidatePath } from "next/cache";
import { setPostSaved, setTutorFollow } from "@/lib/feed-queries";

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
