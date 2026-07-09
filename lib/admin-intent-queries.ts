import { eq } from "drizzle-orm";
import { posts as seedPosts, tutors as seedTutors } from "@/data/twutor";
import { getAgenticIntentTransitionErrors } from "@/lib/admin-intents";
import { buildAgenticIntentAdminRows, getAgenticIntentStatusCounts } from "@/lib/admin-intents";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { agenticPostIntents, contentBriefs, feedEvents, posts, tutors } from "@/lib/db/schema";
import { buildSeedRows } from "@/lib/seed-data";

export async function getAgenticIntentAdminData() {
  if (!getDatabaseUrl()) {
    const seed = buildSeedRows({ tutors: seedTutors, posts: seedPosts });
    const rows = buildAgenticIntentAdminRows(seed);
    return { rows, counts: getAgenticIntentStatusCounts(rows) };
  }

  const db = getDb();
  const [intentRows, tutorRows, briefRows, postRows, eventRows] = await Promise.all([
    db.select().from(agenticPostIntents),
    db.select().from(tutors),
    db.select().from(contentBriefs),
    db.select().from(posts),
    db.select().from(feedEvents)
  ]);

  const rows = buildAgenticIntentAdminRows({
    agenticPostIntents: intentRows,
    tutors: tutorRows,
    contentBriefs: briefRows,
    posts: postRows,
    feedEvents: eventRows
  });

  return { rows, counts: getAgenticIntentStatusCounts(rows) };
}

export async function publishAgenticIntentFromAdmin(intentId: string, publishedPostId: string) {
  if (!getDatabaseUrl()) return { ok: true as const, skipped: true as const };

  const db = getDb();
  const [intent] = await db.select().from(agenticPostIntents).where(eq(agenticPostIntents.id, intentId));
  if (!intent) return { ok: false as const, errors: ["intent not found"] };

  const errors = getAgenticIntentTransitionErrors(intent, "publish", publishedPostId);
  if (errors.length) return { ok: false as const, errors };

  await db
    .update(agenticPostIntents)
    .set({ status: "published", publishedPostId, updatedAt: new Date() })
    .where(eq(agenticPostIntents.id, intentId));

  return { ok: true as const };
}

export async function retireAgenticIntentFromAdmin(intentId: string) {
  if (!getDatabaseUrl()) return { ok: true as const, skipped: true as const };

  const db = getDb();
  await db
    .update(agenticPostIntents)
    .set({ status: "retired", updatedAt: new Date() })
    .where(eq(agenticPostIntents.id, intentId));

  return { ok: true as const };
}
