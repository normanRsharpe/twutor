"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentLearner } from "@/lib/auth/server";
import { addLearnerPrivateMemoryNote } from "@/lib/learner-memory-queries";
import { runObservedAction } from "@/lib/operational-events";

export async function savePrivateLearnerNote(formData: FormData) {
  const learner = await requireCurrentLearner();
  const body = String(formData.get("body") ?? "").trim().slice(0, 5_000);
  await runObservedAction(
    { action: "private_memory" },
    () => addLearnerPrivateMemoryNote(learner.id, body)
  );
  revalidatePath("/memory");
}
