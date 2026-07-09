"use server";

import { revalidatePath } from "next/cache";
import { publishAgenticIntentFromAdmin, retireAgenticIntentFromAdmin } from "@/lib/admin-intent-queries";

export async function publishAgenticIntentAction(formData: FormData) {
  const intentId = String(formData.get("intentId") ?? "");
  const publishedPostId = String(formData.get("publishedPostId") ?? "").trim();

  if (!intentId) return;

  await publishAgenticIntentFromAdmin(intentId, publishedPostId);
  revalidatePath("/admin/intents");
}

export async function retireAgenticIntentAction(formData: FormData) {
  const intentId = String(formData.get("intentId") ?? "");

  if (!intentId) return;

  await retireAgenticIntentFromAdmin(intentId);
  revalidatePath("/admin/intents");
}
