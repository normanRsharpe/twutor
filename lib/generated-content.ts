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

export type GeneratedPostRow = {
  id: string;
  tutorId: TutorId;
  kind: GeneratedContentKind;
  body: string;
  timeLabel: string;
  sortOrder: number;
};

function buildGeneratedContentPrompt(input: Pick<ContentDraftGenerationInput, "kind" | "tutor" | "theme">) {
  return [
    `Generate a Twutor ${input.kind} draft for ${input.tutor.name} (${input.tutor.handle}).`,
    `Tutor lens: ${input.tutor.angle}.`,
    `Theme: ${input.theme}.`,
    "Keep it feed-native, specific, and ready for editorial review.",
    "Retain enough prompt metadata for audit before publish."
  ].join("\n");
}

export async function createGeneratedContentDraft({
  tutor,
  kind,
  theme,
  aiClient,
  idGenerator = () => crypto.randomUUID(),
  now = () => new Date()
}: {
  tutor: Tutor;
  kind: GeneratedContentKind;
  theme: string;
  aiClient: TwutorAIClient;
  idGenerator?: () => string;
  now?: () => Date;
}): Promise<GeneratedContentDraft> {
  const trimmedTheme = theme.trim();
  if (!trimmedTheme) throw new Error("Theme is required");

  const prompt = buildGeneratedContentPrompt({ tutor, kind, theme: trimmedTheme });
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
    metadata: generation.metadata,
    publishedPostId: null,
    createdAt,
    updatedAt: createdAt
  };
}

function publishErrors(draft: GeneratedContentDraft) {
  const errors: string[] = [];
  if (draft.status !== "draft") errors.push("only draft content can be published");
  if (!draft.body.trim()) errors.push("draft body is required");
  if (!draft.prompt.trim()) errors.push("prompt metadata is required");
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
