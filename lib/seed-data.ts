import type { Post, Tutor, TutorId } from "@/data/twutor";
import type {
  challenges,
  diagramNodes,
  generatedAssets,
  learners,
  pollOptions,
  postMetrics,
  posts as postTable,
  quotePosts,
  traceCards,
  tutorFollows,
  tutors as tutorTable
} from "@/lib/db/schema";

export const demoLearnerId = "norman";

export type PostKind = "text" | "diagram" | "quote" | "poll" | "trace" | "challenge";

export type SeedRows = {
  learners: (typeof learners.$inferInsert)[];
  tutors: (typeof tutorTable.$inferInsert)[];
  generatedAssets: (typeof generatedAssets.$inferInsert)[];
  follows: (typeof tutorFollows.$inferInsert)[];
  posts: (typeof postTable.$inferInsert)[];
  postMetrics: (typeof postMetrics.$inferInsert)[];
  diagramNodes: (typeof diagramNodes.$inferInsert)[];
  quotePosts: (typeof quotePosts.$inferInsert)[];
  pollOptions: (typeof pollOptions.$inferInsert)[];
  traceCards: (typeof traceCards.$inferInsert)[];
  challenges: (typeof challenges.$inferInsert)[];
};

const tutorDetails: Record<TutorId, { bio: string; specialtyTags: string[]; avatarPrompt: string }> = {
  eval: {
    bio: "Ships eval systems that turn embarrassing AI failures into boring regression gates.",
    specialtyTags: ["evals", "regression gates", "release confidence"],
    avatarPrompt: "Editorial profile portrait for Dr. Eval Singh, AI evals tutor, dark social app aesthetic."
  },
  maya: {
    bio: "Builds golden paths for teams turning AI experiments into reliable internal platforms.",
    specialtyTags: ["platform APIs", "golden paths", "developer experience"],
    avatarPrompt: "Editorial profile portrait for Maya Chen, platform engineering tutor, orange work jacket, infrastructure blueprint background."
  },
  nora: {
    bio: "Explains RAG, context quality, citations, and knowledge systems without vector-database theater.",
    specialtyTags: ["RAG", "citations", "knowledge systems"],
    avatarPrompt: "Editorial profile portrait for Nora Context, RAG tutor, green vector search and document chunk motif."
  },
  sam: {
    bio: "Treats every AI system as hostile until policy, sandboxing, and observability prove otherwise.",
    specialtyTags: ["security", "policy", "guardrails"],
    avatarPrompt: "Editorial profile portrait for Sam Guardrail, security tutor, red-team lighting, shield and lock motifs."
  },
  iris: {
    bio: "Turns traces, logs, eval samples, and tool calls into explanations humans can trust.",
    specialtyTags: ["observability", "OpenTelemetry", "AI traces"],
    avatarPrompt: "Editorial profile portrait for Iris Trace, observability tutor, blue violet trace lines and terminal glow."
  },
  theo: {
    bio: "Prices the dream: inference latency, GPU spend, routing choices, and runtime tradeoffs.",
    specialtyTags: ["inference", "cost", "runtime"],
    avatarPrompt: "Editorial profile portrait for Theo Runtime, inference infrastructure tutor, GPU racks and amber cost chart lighting."
  }
};

function kindFor(post: Post): PostKind {
  if (post.diagram) return "diagram";
  if (post.quote) return "quote";
  if (post.poll) return "poll";
  if (post.trace) return "trace";
  if (post.challenge) return "challenge";
  return "text";
}

export function buildSeedRows({ tutors, posts }: { tutors: Record<TutorId, Tutor>; posts: Post[] }): SeedRows {
  const tutorRows = Object.values(tutors).map((tutor) => ({
    id: tutor.id,
    name: tutor.name,
    handle: tutor.handle,
    avatarUrl: tutor.avatar,
    bio: tutorDetails[tutor.id].bio,
    angle: tutor.angle,
    specialtyTags: tutorDetails[tutor.id].specialtyTags,
    isVerified: true
  }));

  return {
    learners: [{ id: demoLearnerId, name: "Norman Sharpe", handle: "@learner", avatarUrl: "/assets/avatars/learner.svg" }],
    tutors: tutorRows,
    generatedAssets: tutorRows.map((tutor) => ({
      id: `avatar-${tutor.id}`,
      ownerType: "tutor" as const,
      ownerId: tutor.id,
      provider: "openai",
      model: "gpt-image-2-medium",
      prompt: tutorDetails[tutor.id as TutorId].avatarPrompt,
      url: tutor.avatarUrl,
      metadata: { style: "dark social app portrait", source: "Hermes image_generate" }
    })),
    follows: ["eval", "maya"].map((tutorId) => ({ learnerId: demoLearnerId, tutorId })),
    posts: posts.map((post, index) => ({
      id: post.id,
      tutorId: post.tutorId,
      kind: kindFor(post),
      body: post.body,
      timeLabel: post.time,
      sortOrder: index
    })),
    postMetrics: posts.map((post) => ({ postId: post.id, ...post.metrics })),
    diagramNodes: posts.flatMap((post) =>
      post.diagram?.nodes.map((label, position) => ({ postId: post.id, position, label, caption: post.diagram!.caption })) ?? []
    ),
    quotePosts: posts.flatMap((post) =>
      post.quote ? [{ postId: post.id, tutorId: post.quote.tutorId, timeLabel: post.quote.time, body: post.quote.body }] : []
    ),
    pollOptions: posts.flatMap((post) =>
      post.poll?.map((option, position) => ({ postId: post.id, position, label: option.label, percent: option.percent })) ?? []
    ),
    traceCards: posts.flatMap((post) => (post.trace ? [{ postId: post.id, payload: post.trace }] : [])),
    challenges: posts.flatMap((post) =>
      post.challenge ? [{ id: `challenge-${post.id}`, postId: post.id, ...post.challenge }] : []
    )
  };
}
