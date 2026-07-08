"use server";

import { revalidatePath } from "next/cache";
import { setTutorFollow } from "@/lib/feed-queries";

export async function toggleTutorFollow(formData: FormData) {
  const tutorId = String(formData.get("tutorId") ?? "");
  const follow = String(formData.get("follow") ?? "false") === "true";

  if (!tutorId) return;

  await setTutorFollow(tutorId, follow);
  revalidatePath("/");
  revalidatePath(`/tutors/${tutorId}`);
}
