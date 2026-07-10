"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentLearner } from "@/lib/auth/server";
import { addLearnerPrivateMemoryNote } from "@/lib/learner-memory-queries";

export async function savePrivateLearnerNote(formData: FormData) {
  await requireCurrentLearner();
  const body = String(formData.get("body") ?? "").trim().slice(0, 5_000);
  await addLearnerPrivateMemoryNote(body);
  revalidatePath("/memory");
}
