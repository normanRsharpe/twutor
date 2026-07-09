"use server";

import { revalidatePath } from "next/cache";
import { addLearnerPrivateMemoryNote } from "@/lib/learner-memory-queries";

export async function savePrivateLearnerNote(formData: FormData) {
  const body = String(formData.get("body") ?? "");
  await addLearnerPrivateMemoryNote(body);
  revalidatePath("/memory");
}
