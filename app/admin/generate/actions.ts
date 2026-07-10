"use server";

import { revalidatePath } from "next/cache";
import { requireAdminLearner } from "@/lib/auth/server";
import { generateAdminContentDraft, publishAdminGeneratedContentDraft } from "@/lib/generated-content-queries";
import type { GeneratedContentKind } from "@/lib/generated-content";

const generatedKinds = new Set<GeneratedContentKind>(["text", "diagram", "quote", "poll", "trace", "challenge"]);

export async function generateContentDraftAction(formData: FormData) {
  await requireAdminLearner();
  const theme = String(formData.get("theme") ?? "").trim().slice(0, 200);
  const requestedKind = String(formData.get("kind") ?? "diagram") as GeneratedContentKind;
  if (!theme) return;

  await generateAdminContentDraft({
    theme,
    kind: generatedKinds.has(requestedKind) ? requestedKind : "diagram",
    tutorId: "maya"
  });
  revalidatePath("/admin/generate");
}

export async function publishContentDraftAction(formData: FormData) {
  await requireAdminLearner();
  const draftId = String(formData.get("draftId") ?? "").trim().slice(0, 200);
  if (!draftId) return;

  await publishAdminGeneratedContentDraft(draftId);
  revalidatePath("/admin/generate");
}
