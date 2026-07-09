import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { posts as seedPosts, tutors as seedTutors, type TutorId } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { generatedContentDrafts, postMetrics, posts, tutors } from "@/lib/db/schema";
import {
  buildGeneratedContentAdminRows,
  createGeneratedContentDraft,
  publishGeneratedContentDraft,
  type GeneratedContentAdminRow,
  type GeneratedContentDraft,
  type GeneratedContentKind,
  type GeneratedPostRow
} from "@/lib/generated-content";
import { getTwutorAIClient } from "@/lib/twutor-ai";

let fallbackDrafts: GeneratedContentDraft[] = [];
let fallbackGeneratedPosts: GeneratedPostRow[] = [];

export function resetFallbackGeneratedContentState() {
  fallbackDrafts = [];
  fallbackGeneratedPosts = [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function toDraft(row: typeof generatedContentDrafts.$inferSelect): GeneratedContentDraft {
  return {
    id: row.id,
    status: row.status,
    tutorId: row.tutorId as TutorId,
    kind: row.kind,
    theme: row.theme,
    prompt: row.prompt,
    provider: row.provider,
    model: row.model,
    body: row.body,
    metadata: row.metadata,
    publishedPostId: row.publishedPostId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function getFallbackGeneratedPostRows() {
  return fallbackGeneratedPosts;
}

export async function generateAdminContentDraft({
  tutorId = "maya",
  kind = "diagram",
  theme
}: {
  tutorId?: TutorId;
  kind?: GeneratedContentKind;
  theme: string;
}) {
  const tutor = seedTutors[tutorId];
  const draft = await createGeneratedContentDraft({ tutor, kind, theme, aiClient: getTwutorAIClient(), idGenerator: randomUUID });

  if (!getDatabaseUrl()) {
    const existing = fallbackDrafts.find(
      (candidate) => candidate.tutorId === tutorId && candidate.kind === kind && candidate.theme.toLowerCase() === draft.theme.toLowerCase()
    );
    if (existing) {
      const reopenedDraft: GeneratedContentDraft = { ...existing, status: "draft", publishedPostId: null, updatedAt: new Date() };
      fallbackDrafts = [reopenedDraft, ...fallbackDrafts.filter((candidate) => candidate.id !== existing.id)];
      return reopenedDraft;
    }
    fallbackDrafts = [draft, ...fallbackDrafts];
    return draft;
  }

  await getDb().insert(generatedContentDrafts).values(draft);
  return draft;
}

export async function publishAdminGeneratedContentDraft(draftId: string) {
  if (!getDatabaseUrl()) {
    const draft = fallbackDrafts.find((candidate) => candidate.id === draftId);
    if (!draft) return null;

    const published = publishGeneratedContentDraft(draft, {
      postId: `generated-${slugify(draft.theme)}`,
      sortOrder: seedPosts.length + fallbackGeneratedPosts.length
    });
    fallbackDrafts = fallbackDrafts.map((candidate) => (candidate.id === draftId ? published.draft : candidate));
    fallbackGeneratedPosts = [published.post, ...fallbackGeneratedPosts.filter((post) => post.id !== published.post.id)];
    return published;
  }

  const db = getDb();
  const [draftRow] = await db.select().from(generatedContentDrafts).where(eq(generatedContentDrafts.id, draftId));
  if (!draftRow) return null;
  const postRows = await db.select().from(posts).orderBy(asc(posts.sortOrder));
  const published = publishGeneratedContentDraft(toDraft(draftRow), {
    postId: `generated-${slugify(draftRow.theme)}`,
    sortOrder: postRows.length
  });

  await db.transaction(async (tx) => {
    await tx.insert(posts).values(published.post).onConflictDoNothing();
    await tx.insert(postMetrics).values({ postId: published.post.id, replies: "0", reposts: "0", checks: "0", views: "0" }).onConflictDoNothing();
    await tx
      .update(generatedContentDrafts)
      .set({ status: "published", publishedPostId: published.post.id, updatedAt: new Date() })
      .where(eq(generatedContentDrafts.id, draftId));
  });

  return published;
}

export async function getGeneratedContentAdminData(): Promise<{ rows: GeneratedContentAdminRow[] }> {
  if (!getDatabaseUrl()) {
    return {
      rows: buildGeneratedContentAdminRows({
        drafts: fallbackDrafts,
        tutors: seedTutors,
        posts: [...fallbackGeneratedPosts, ...seedPosts]
      })
    };
  }

  const [draftRows, tutorRows, postRows] = await Promise.all([
    getDb().select().from(generatedContentDrafts),
    getDb().select().from(tutors),
    getDb().select().from(posts).orderBy(asc(posts.sortOrder))
  ]);

  const tutorRecord = Object.fromEntries(tutorRows.map((tutor) => [tutor.id, { id: tutor.id as TutorId, name: tutor.name, handle: tutor.handle, avatar: tutor.avatarUrl, angle: tutor.angle }])) as typeof seedTutors;
  return { rows: buildGeneratedContentAdminRows({ drafts: draftRows.map(toDraft), tutors: tutorRecord, posts: postRows }) };
}
