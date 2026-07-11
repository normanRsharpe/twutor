import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { posts as seedPosts, tutors as seedTutors, type TutorId } from "@/data/twutor";
import { getDatabaseUrl, getDb } from "@/lib/db/client";
import { contentBriefs, generatedContentDrafts, postMetrics, posts, tutors } from "@/lib/db/schema";
import {
  buildGeneratedContentAdminRows,
  buildGeneratedPostId,
  createGeneratedContentCandidates,
  publishGeneratedContentDraft,
  reviewGeneratedContentDraft,
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
    sourceBriefId: row.sourceBriefId,
    variantIndex: row.variantIndex,
    reviewStatus: row.reviewStatus as GeneratedContentDraft["reviewStatus"],
    revisionReason: row.revisionReason,
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
  theme,
  sourceBriefId = null,
  briefSummary,
  editorLearnerId
}: {
  tutorId?: TutorId;
  kind?: GeneratedContentKind;
  theme: string;
  sourceBriefId?: string | null;
  briefSummary?: string;
  editorLearnerId?: string;
}) {
  const tutor = seedTutors[tutorId];
  let reviewedBriefSummary = briefSummary;
  if (getDatabaseUrl()) {
    if (!sourceBriefId || !editorLearnerId) throw new Error("An active owned content brief is required");
    const [brief] = await getDb().select().from(contentBriefs).where(and(eq(contentBriefs.id, sourceBriefId), eq(contentBriefs.learnerId, editorLearnerId), eq(contentBriefs.status, "active")));
    if (!brief) throw new Error("Active content brief not found for this editor");
    reviewedBriefSummary = `${brief.objective}\n${brief.learnerContextSnapshot}`;
  }
  const drafts = await createGeneratedContentCandidates({ tutor, kind, theme, sourceBriefId, briefSummary: reviewedBriefSummary, variantCount: 2, aiClient: getTwutorAIClient(), idGenerator: randomUUID });
  const draft = drafts[0];

  if (!getDatabaseUrl()) {
    fallbackDrafts = [...drafts, ...fallbackDrafts];
    return drafts;
  }

  await getDb().insert(generatedContentDrafts).values(drafts);
  return drafts;
}

export async function reviewAdminGeneratedContentDraft(draftId: string, decision: "approved" | "rejected", revisionReason: string | null) {
  if (!getDatabaseUrl()) {
    const draft = fallbackDrafts.find((candidate) => candidate.id === draftId);
    if (!draft) return null;
    const reviewed = reviewGeneratedContentDraft(draft, { decision, revisionReason });
    fallbackDrafts = fallbackDrafts.map((candidate) => candidate.id === draftId ? reviewed : candidate);
    return reviewed;
  }
  const db = getDb();
  const [row] = await db.select().from(generatedContentDrafts).where(eq(generatedContentDrafts.id, draftId));
  if (!row) return null;
  const reviewed = reviewGeneratedContentDraft(toDraft(row), { decision, revisionReason });
  const transitioned = await db.update(generatedContentDrafts)
    .set({ reviewStatus: reviewed.reviewStatus, revisionReason: reviewed.revisionReason, updatedAt: reviewed.updatedAt })
    .where(and(eq(generatedContentDrafts.id, draftId), eq(generatedContentDrafts.status, "draft")))
    .returning({ id: generatedContentDrafts.id });
  if (transitioned.length !== 1) throw new Error("Only unpublished drafts can be reviewed");
  return reviewed;
}

export async function publishAdminGeneratedContentDraft(draftId: string) {
  if (!getDatabaseUrl()) {
    const draft = fallbackDrafts.find((candidate) => candidate.id === draftId);
    if (!draft) return null;

    const published = publishGeneratedContentDraft(draft, {
      postId: buildGeneratedPostId(draft),
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
    postId: buildGeneratedPostId(toDraft(draftRow)),
    sortOrder: postRows.length
  });

  await db.transaction(async (tx) => {
    const transitioned = await tx.update(generatedContentDrafts)
      .set({ status: "published", publishedPostId: published.post.id, updatedAt: new Date() })
      .where(and(eq(generatedContentDrafts.id, draftId), eq(generatedContentDrafts.status, "draft"), eq(generatedContentDrafts.reviewStatus, "approved")))
      .returning({ id: generatedContentDrafts.id });
    if (transitioned.length !== 1) throw new Error("Draft was already published or is no longer approved");
    await tx.insert(posts).values(published.post);
    await tx.insert(postMetrics).values({ postId: published.post.id, replies: "0", reposts: "0", checks: "0", views: "0" });
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
