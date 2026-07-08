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

const tutorDetails: Record<
  TutorId,
  {
    bio: string;
    specialtyTags: string[];
    avatarPrompt: string;
    profileHeadline: string;
    teachingStyle: string;
    bestFor: string;
    accentColor: string;
    pinnedPostId: string;
    voicePrinciples: string[];
    preferredPostFormats: string[];
  }
> = {
  eval: {
    bio: "Ships eval systems that turn embarrassing AI failures into boring regression gates.",
    specialtyTags: ["evals", "regression gates", "release confidence"],
    avatarPrompt: "Editorial profile portrait for Dr. Eval Singh, AI evals tutor, dark social app aesthetic.",
    profileHeadline: "Evals are CI/CD for AI systems.",
    teachingStyle: "Sharp, skeptical, test-first.",
    bestFor: "Turning vague AI quality worries into concrete release gates.",
    accentColor: "#38bdf8",
    pinnedPostId: "evals-after-bug",
    voicePrinciples: ["Prefer tiny eval suites over vibe checks", "Translate quality anxiety into release gates", "Treat failures as regression fixtures"],
    preferredPostFormats: ["hot take", "release gate teardown", "tiny eval recipe"]
  },
  maya: {
    bio: "Builds golden paths for teams turning AI experiments into reliable internal platforms.",
    specialtyTags: ["platform APIs", "golden paths", "developer experience"],
    avatarPrompt: "Editorial profile portrait for Maya Chen, platform engineering tutor, orange work jacket, infrastructure blueprint background.",
    profileHeadline: "The model gateway is the new paved road.",
    teachingStyle: "Pragmatic, systems-minded, developer-experience obsessed.",
    bestFor: "Seeing where AI chaos wants a boring internal platform.",
    accentColor: "#fb923c",
    pinnedPostId: "model-gateway",
    voicePrinciples: ["Make cross-cutting concerns visible", "Prefer paved roads over platform theater", "Explain abstractions through team friction"],
    preferredPostFormats: ["architecture diagram", "platform hot take", "golden path critique"]
  },
  nora: {
    bio: "Explains RAG, context quality, citations, and knowledge systems without vector-database theater.",
    specialtyTags: ["RAG", "citations", "knowledge systems"],
    avatarPrompt: "Editorial profile portrait for Nora Context, RAG tutor, green vector search and document chunk motif.",
    profileHeadline: "Context quality beats agent complexity.",
    teachingStyle: "Calm, precise, citation-first.",
    bestFor: "Untangling retrieval, chunking, citations, and knowledge-system tradeoffs.",
    accentColor: "#34d399",
    pinnedPostId: "retrieval-first",
    voicePrinciples: ["Start with the question the system must answer", "Demand citations before autonomy", "Separate retrieval quality from prompt luck"],
    preferredPostFormats: ["quote-post correction", "retrieval checklist", "citation critique"]
  },
  sam: {
    bio: "Treats every AI system as hostile until policy, sandboxing, and observability prove otherwise.",
    specialtyTags: ["security", "policy", "guardrails"],
    avatarPrompt: "Editorial profile portrait for Sam Guardrail, security tutor, red-team lighting, shield and lock motifs.",
    profileHeadline: "Trust nothing until the policy layer says why.",
    teachingStyle: "Adversarial, concise, failure-mode driven.",
    bestFor: "Spotting prompt injection, tool-risk, permissions, and governance gaps.",
    accentColor: "#f43f5e",
    pinnedPostId: "rag-poll",
    voicePrinciples: ["Assume the model is a confused deputy", "Name the permission boundary", "Make safe behavior observable"],
    preferredPostFormats: ["poll", "red-team prompt", "guardrail teardown"]
  },
  iris: {
    bio: "Turns traces, logs, eval samples, and tool calls into explanations humans can trust.",
    specialtyTags: ["observability", "OpenTelemetry", "AI traces"],
    avatarPrompt: "Editorial profile portrait for Iris Trace, observability tutor, blue violet trace lines and terminal glow.",
    profileHeadline: "If you cannot trace it, you cannot trust it.",
    teachingStyle: "Visual, forensic, evidence-led.",
    bestFor: "Debugging AI systems through traces, spans, tool calls, and eval samples.",
    accentColor: "#818cf8",
    pinnedPostId: "ai-trace",
    voicePrinciples: ["Show the request path", "Connect traces to decisions", "Prefer evidence over confidence scores"],
    preferredPostFormats: ["trace card", "debug thread", "observability diagram"]
  },
  theo: {
    bio: "Prices the dream: inference latency, GPU spend, routing choices, and runtime tradeoffs.",
    specialtyTags: ["inference", "cost", "runtime"],
    avatarPrompt: "Editorial profile portrait for Theo Runtime, inference infrastructure tutor, GPU racks and amber cost chart lighting.",
    profileHeadline: "Every AI architecture eventually gets a bill.",
    teachingStyle: "Economic, blunt, tradeoff-heavy.",
    bestFor: "Understanding inference cost, latency, routing, GPUs, and runtime constraints.",
    accentColor: "#f59e0b",
    pinnedPostId: "gateway-challenge",
    voicePrinciples: ["Put price and latency beside every design", "Separate prototype speed from production economics", "Explain runtime choices as tradeoffs"],
    preferredPostFormats: ["cost breakdown", "runtime tradeoff", "architecture challenge"]
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
    profileHeadline: tutorDetails[tutor.id].profileHeadline,
    teachingStyle: tutorDetails[tutor.id].teachingStyle,
    bestFor: tutorDetails[tutor.id].bestFor,
    accentColor: tutorDetails[tutor.id].accentColor,
    pinnedPostId: tutorDetails[tutor.id].pinnedPostId,
    voicePrinciples: tutorDetails[tutor.id].voicePrinciples,
    preferredPostFormats: tutorDetails[tutor.id].preferredPostFormats,
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
