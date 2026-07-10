"use server";

import { revalidatePath } from "next/cache";
import { publishAgenticIntentFromAdmin, retireAgenticIntentFromAdmin } from "@/lib/admin-intent-queries";
import { requireAdminLearner } from "@/lib/auth/server";

export async function publishAgenticIntentAction(formData: FormData) {
  await requireAdminLearner();
  const intentId = String(formData.get("intentId") ?? "");
  const publishedPostId = String(formData.get("publishedPostId") ?? "").trim();

  if (!intentId) return;

  await publishAgenticIntentFromAdmin(intentId, publishedPostId);
  revalidatePath("/admin/intents");
}

export async function retireAgenticIntentAction(formData: FormData) {
  await requireAdminLearner();
  const intentId = String(formData.get("intentId") ?? "");

  if (!intentId) return;

  await retireAgenticIntentFromAdmin(intentId);
  revalidatePath("/admin/intents");
}
