import { describe, expect, it } from "vitest";
import { posts, tutors } from "@/data/twutor";
import {
  buildAgenticIntentAdminRows,
  getAgenticIntentStatusCounts,
  getAgenticIntentTransitionErrors,
  isAgenticIntentsAdminEnabled
} from "@/lib/admin-intents";
import { buildSeedRows } from "@/lib/seed-data";

describe("agentic intent admin surface", () => {
  it("builds inspectable admin rows with tutor, brief, hypothesis, voice, and risk context", () => {
    const rows = buildSeedRows({ tutors, posts });
    const adminRows = buildAgenticIntentAdminRows(rows);

    expect(adminRows).toHaveLength(rows.agenticPostIntents.length);
    expect(adminRows[0]).toMatchObject({
      id: "intent-maya-gateway-confidence",
      status: "planned",
      tutorName: "Maya Chen",
      briefTheme: "Agentic feed ops foundation",
      feedMove: "confidence_boost",
      noveltyLevel: "familiar",
      suggestedPostKind: "diagram",
      publishBlocked: true
    });
    expect(adminRows[0].publishErrors).toContain("published post id is required");
    expect(adminRows[0].landingHypothesis).toMatch(/easy win/i);
    expect(adminRows[0].voiceNotes).toMatch(/Maya/i);
    expect(adminRows[0].riskNotes).toMatch(/rewarding/i);
  });

  it("summarizes intents by lifecycle status for the admin review queue", () => {
    const rows = buildSeedRows({ tutors, posts });
    const [first, second, ...rest] = rows.agenticPostIntents;
    const adminRows = buildAgenticIntentAdminRows({
      ...rows,
      agenticPostIntents: [
        { ...first, status: "published", publishedPostId: "model-gateway" },
        { ...second, status: "retired" },
        ...rest
      ]
    });

    expect(getAgenticIntentStatusCounts(adminRows)).toEqual({ planned: 2, published: 1, retired: 1 });
  });

  it("guards unsafe publish transitions but allows retiring planned or published intents", () => {
    const rows = buildSeedRows({ tutors, posts });
    const intent = rows.agenticPostIntents[0];

    expect(getAgenticIntentTransitionErrors(intent, "publish", "")).toContain("published post id is required");
    expect(getAgenticIntentTransitionErrors(intent, "publish", "model-gateway")).toEqual([]);
    expect(getAgenticIntentTransitionErrors(intent, "retire")).toEqual([]);
    expect(getAgenticIntentTransitionErrors({ ...intent, status: "retired" }, "publish", "model-gateway")).toContain("retired intents cannot be published");
  });

  it("keeps the admin surface disabled in production unless explicitly enabled", () => {
    expect(isAgenticIntentsAdminEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isAgenticIntentsAdminEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isAgenticIntentsAdminEnabled({ NODE_ENV: "production", TWUTOR_ENABLE_ADMIN_INTENTS: "true" })).toBe(true);
  });
});
