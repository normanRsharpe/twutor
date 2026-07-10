"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentLearner } from "@/lib/auth/server";
import { completeLearnerOnboarding } from "@/lib/onboarding-queries";

export async function submitOnboarding(formData: FormData) {
  const learner = await requireCurrentLearner();
  const skipped = String(formData.get("intent") ?? "") === "skip";
  await completeLearnerOnboarding({
    learnerId: learner.id,
    goal: String(formData.get("goal") ?? ""),
    level: String(formData.get("level") ?? ""),
    cadence: String(formData.get("cadence") ?? ""),
    topics: formData.getAll("topics").map(String),
    tutors: formData.getAll("tutors").map(String),
    skipped
  });
  revalidatePath("/");
  redirect("/");
}
