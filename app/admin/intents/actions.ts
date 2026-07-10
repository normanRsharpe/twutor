"use server";

import { revalidatePath } from "next/cache";
import { publishAgenticIntentFromAdmin, retireAgenticIntentFromAdmin } from "@/lib/admin-intent-queries";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { requireAdminLearner } from "@/lib/auth/server";

export async function publishAgenticIntentAction(formData: FormData) {
  const learner = await requireAdminLearner();
  const intentId = String(formData.get("intentId") ?? "");
  const publishedPostId = String(formData.get("publishedPostId") ?? "").trim();

  if (!intentId) return;

  await publishAgenticIntentFromAdmin(intentId, publishedPostId);
  await recordAdminAuditEvent({ actorAuthUserId: learner.authUserId, action: "publish", targetType: "agentic_post_intent", targetId: intentId, outcome: "success", metadata: { publishedPostId } });
  revalidatePath("/admin/intents");
}

export async function retireAgenticIntentAction(formData: FormData) {
  const learner = await requireAdminLearner();
  const intentId = String(formData.get("intentId") ?? "");

  if (!intentId) return;

  await retireAgenticIntentFromAdmin(intentId);
  await recordAdminAuditEvent({ actorAuthUserId: learner.authUserId, action: "retire", targetType: "agentic_post_intent", targetId: intentId, outcome: "success" });
  revalidatePath("/admin/intents");
}
