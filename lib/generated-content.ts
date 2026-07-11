import type { Post, Tutor, TutorId } from "@/data/twutor";
import type { ContentDraftGenerationInput, TwutorAIClient } from "@/lib/twutor-ai";

export type GeneratedContentKind = "text" | "diagram" | "quote" | "poll" | "trace" | "challenge";
export type GeneratedContentStatus = "draft" | "published" | "archived";

export type GeneratedContentDraft = {
  id: string;
  status: GeneratedContentStatus;
  tutorId: TutorId;
  kind: GeneratedContentKind;
  theme: string;
  prompt: string;
  provider: string;
  model: string;
  body: string;
  metadata: Record<string, unknown>;
  sourceBriefId: string | null;
  variantIndex: number;
  reviewStatus: "pending" | "approved" | "rejected";
  revisionReason: string | null;
  publishedPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GeneratedContentAdminRow = GeneratedContentDraft & {
  tutorName: string;
  tutorHandle: string;
  tutorAvatarUrl: string;
  publishedPostLabel: string | null;
  publishBlocked: boolean;
  publishErrors: string[];
};

export function buildGeneratedPostId(draft: Pick<GeneratedContentDraft, "id" | "theme">) {
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return `generated-${slug(draft.theme)}-${slug(draft.id)}`;
}

export type GeneratedPostRow = {
  id: string;
  tutorId: TutorId;
  kind: GeneratedContentKind;
  body: string;
  timeLabel: string;
  sortOrder: number;
};

function buildGeneratedContentPrompt(input: Pick<ContentDraftGenerationInput, "kind" | "tutor" | "theme"> & { briefSummary?: string; variantIndex?: number }) {
  return [
    `Generate a Twutor ${input.kind} draft for ${input.tutor.name} (${input.tutor.handle}).`,
    `Tutor lens: ${input.tutor.angle}.`,
    `Theme: ${input.theme}.`,
    input.briefSummary ? `Reviewed content brief: ${input.briefSummary}` : "No source brief supplied.",
    `Variant: ${(input.variantIndex ?? 0) + 1}.`,
    "Keep it feed-native, specific, and ready for editorial review.",
    "Retain enough prompt metadata for audit before publish."
  ].join("\n");
}

export async function createGeneratedContentDraft({
  tutor,
  kind,
  theme,
  aiClient,
  sourceBriefId = null,
  briefSummary,
  variantIndex = 0,
  idGenerator = () => crypto.randomUUID(),
  now = () => new Date()
}: {
  tutor: Tutor;
  kind: GeneratedContentKind;
  theme: string;
  aiClient: TwutorAIClient;
  sourceBriefId?: string | null;
  briefSummary?: string;
  variantIndex?: number;
  idGenerator?: () => string;
  now?: () => Date;
}): Promise<GeneratedContentDraft> {
  const trimmedTheme = theme.trim();
  if (!trimmedTheme) throw new Error("Theme is required");

  const prompt = buildGeneratedContentPrompt({ tutor, kind, theme: trimmedTheme, briefSummary, variantIndex });
  const generation = await aiClient.generateContentDraft({ tutor, kind, theme: trimmedTheme, prompt });
  const createdAt = now();

  return {
    id: idGenerator(),
    status: "draft",
    tutorId: tutor.id,
    kind,
    theme: trimmedTheme,
    prompt,
    provider: generation.provider,
    model: generation.model,
    body: generation.body,
    metadata: { ...generation.metadata, promptVersion: "content-draft-v1" },
    sourceBriefId,
    variantIndex,
    reviewStatus: "pending",
    revisionReason: null,
    publishedPostId: null,
    createdAt,
    updatedAt: createdAt
  };
}

export async function createGeneratedContentCandidates(input: Parameters<typeof createGeneratedContentDraft>[0] & { variantCount?: number }) {
  const count = Math.max(1, Math.min(input.variantCount ?? 2, 4));
  const drafts: GeneratedContentDraft[] = [];
  for (let variantIndex = 0; variantIndex < count; variantIndex += 1) {
    drafts.push(await createGeneratedContentDraft({ ...input, variantIndex }));
  }
  return drafts;
}

export function reviewGeneratedContentDraft(draft: GeneratedContentDraft, review: { decision: "approved" | "rejected"; revisionReason: string | null }) {
  const validationErrors = publishErrors({ ...draft, reviewStatus: "approved" }).filter((error) => error !== "draft must be explicitly approved");
  if (review.decision === "approved" && validationErrors.length) throw new Error(`Draft validation failed: ${validationErrors.join("; ")}`);
  return { ...draft, reviewStatus: review.decision, revisionReason: review.revisionReason, updatedAt: new Date() };
}

function publishErrors(draft: GeneratedContentDraft) {
  const errors: string[] = [];
  if (draft.status !== "draft") errors.push("only draft content can be published");
  if (!draft.body.trim()) errors.push("draft body is required");
  if (!draft.prompt.trim()) errors.push("prompt metadata is required");
  if (draft.metadata.outcome === "failure") errors.push("provider generation did not succeed");
  if (/\[unsupported\]/i.test(draft.body)) errors.push("draft contains unsupported claims");
  if (draft.reviewStatus !== "approved") errors.push("draft must be explicitly approved");
  return errors;
}

export function buildGeneratedContentAdminRows({
  drafts,
  tutors,
  posts
}: {
  drafts: GeneratedContentDraft[];
  tutors: Record<TutorId, Tutor>;
  posts: Pick<Post, "id" | "body">[];
}): GeneratedContentAdminRow[] {
  const postsById = new Map(posts.map((post) => [post.id, post]));

  return [...drafts]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((draft) => {
      const tutor = tutors[draft.tutorId];
      const errors = publishErrors(draft);
      const publishedPost = draft.publishedPostId ? postsById.get(draft.publishedPostId) : null;

      return {
        ...draft,
        tutorName: tutor.name,
        tutorHandle: tutor.handle,
        tutorAvatarUrl: tutor.avatar,
        publishedPostLabel: publishedPost?.body.slice(0, 96) ?? null,
        publishBlocked: errors.length > 0,
        publishErrors: errors
      };
    });
}

export function publishGeneratedContentDraft(
  draft: GeneratedContentDraft,
  { postId, sortOrder, now = new Date() }: { postId: string; sortOrder: number; now?: Date }
): { draft: GeneratedContentDraft; post: GeneratedPostRow } {
  const errors = publishErrors(draft);
  if (errors.length) throw new Error(errors.join("; "));

  return {
    draft: {
      ...draft,
      status: "published",
      publishedPostId: postId,
      updatedAt: now
    },
    post: {
      id: postId,
      tutorId: draft.tutorId,
      kind: draft.kind,
      body: draft.body,
      timeLabel: "now",
      sortOrder
    }
  };
}
