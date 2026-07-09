import type { Post, Tutor, TutorId } from "@/data/twutor";
import type {
  agenticPostIntents,
  challenges,
  contentBriefs,
  diagramNodes,
  feedEvents,
  generatedAssets,
  learnerConceptStates,
  learners,
  pollOptions,
  postMetrics,
  posts as postTable,
  quotePosts,
  researchNotes,
  traceCards,
  tutorFollows,
  learnerSavedPosts,
  learnerPrivateNotes,
  learnerLearningStates,
  tutors as tutorTable
} from "@/lib/db/schema";
import { buildFeedEventRows } from "@/lib/feed-events";

export const demoLearnerId = "norman";

export type PostKind = "text" | "diagram" | "quote" | "poll" | "trace" | "challenge";

export type SeedRows = {
  learners: (typeof learners.$inferInsert)[];
  tutors: (typeof tutorTable.$inferInsert)[];
  generatedAssets: (typeof generatedAssets.$inferInsert)[];
  conceptStates: (typeof learnerConceptStates.$inferInsert)[];
  contentBriefs: (typeof contentBriefs.$inferInsert)[];
  researchNotes: (typeof researchNotes.$inferInsert)[];
  agenticPostIntents: (typeof agenticPostIntents.$inferInsert)[];
  follows: (typeof tutorFollows.$inferInsert)[];
  savedPosts: (typeof learnerSavedPosts.$inferInsert)[];
  privateNotes: (typeof learnerPrivateNotes.$inferInsert)[];
  feedEvents: (typeof feedEvents.$inferInsert)[];
  learningStates: (typeof learnerLearningStates.$inferInsert)[];
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
    conceptStates: [
      {
        learnerId: demoLearnerId,
        conceptSlug: "agent-workflows",
        label: "Agent workflows",
        familiarity: "unknown" as const,
        confidence: 12,
        evidence: "No saved posts or challenge activity yet",
        nextAction: "introduce"
      },
      {
        learnerId: demoLearnerId,
        conceptSlug: "rag-citations",
        label: "RAG citations",
        familiarity: "seen" as const,
        confidence: 32,
        evidence: "Seen retrieval-first post but has not saved or revisited citation mechanics",
        nextAction: "reinforce"
      },
      {
        learnerId: demoLearnerId,
        conceptSlug: "ai-observability",
        label: "AI observability",
        familiarity: "familiar" as const,
        confidence: 64,
        evidence: "Multiple feed exposures around traces and eval samples",
        nextAction: "apply"
      },
      {
        learnerId: demoLearnerId,
        conceptSlug: "model-gateways",
        label: "Model gateways",
        familiarity: "confident" as const,
        confidence: 86,
        evidence: "Saved model gateway post and follows platform tutor",
        nextAction: "extend"
      },
      {
        learnerId: demoLearnerId,
        conceptSlug: "vector-databases",
        label: "Vector databases",
        familiarity: "stale" as const,
        confidence: 48,
        evidence: "Previously saved RAG material but has not revisited retrieval tradeoffs recently",
        nextAction: "revisit"
      }
    ],
    contentBriefs: [
      {
        id: "brief-agentic-feed-foundation",
        learnerId: demoLearnerId,
        status: "active" as const,
        theme: "Agentic feed ops foundation",
        objective:
          "Plan feed-native tutor posts that mix useful randomness with learner-aware scaffolding: one easy win, one leap, one parallel track, and one revisit.",
        targetConceptSlugs: ["agent-workflows", "agent-permissions", "inference-cost"],
        revisitConceptSlugs: ["vector-databases"],
        avoidConceptSlugs: ["multi-agent-framework-shopping"],
        desiredPostMix: [
          {
            feedMove: "confidence_boost",
            count: 1,
            rationale: "Give the learner a rewarding 'I know this one' moment around model gateways."
          },
          {
            feedMove: "leap",
            count: 1,
            rationale: "Open a future security lane with a vivid but non-blocking tool-permission idea."
          },
          {
            feedMove: "parallel_track",
            count: 1,
            rationale: "Add inference-cost texture beside the current platform architecture arc."
          },
          {
            feedMove: "revisit",
            count: 1,
            rationale: "Refresh stale vector database knowledge through citation and retrieval quality."
          }
        ],
        learnerContextSnapshot:
          "Norman is confident on model gateways, stale on vector databases, and new to agent workflows; keep the feed social, varied, and not too curriculum-shaped."
      }
    ],
    researchNotes: [
      {
        id: "note-agent-workflows-boundaries",
        contentBriefId: "brief-agentic-feed-foundation",
        sourceTitle: "Agent workflows need explicit tool boundaries",
        sourceUrl: null,
        summary:
          "Agentic workflows become easier to trust when the system names which tools can be called, which policy gates apply, and what gets traced for review.",
        claims: [
          "Tool permissioning is a platform boundary, not just a prompt instruction.",
          "Policy and traceability make agent behavior reviewable after the fact.",
          "A security-flavored feed post can spark curiosity before the learner has mastered workflows."
        ],
        relatedConceptSlugs: ["agent-workflows", "agent-permissions"],
        reviewNotes: "Good source material for Sam; keep the post vivid and bounded rather than turning it into a policy lecture."
      },
      {
        id: "note-vector-retrieval-quality",
        contentBriefId: "brief-agentic-feed-foundation",
        sourceTitle: "Retrieval quality beats vector database theater",
        sourceUrl: null,
        summary:
          "Retrieval posts should emphasize answer quality, citations, chunking, and reviewable evidence instead of treating the vector database choice as the main event.",
        claims: [
          "Citation quality is a better learner-facing hook than vector database branding.",
          "Stale retrieval concepts can be revisited through practical source-grounding questions.",
          "Nora should connect vector search back to whether a learner can trust the answer."
        ],
        relatedConceptSlugs: ["vector-databases", "rag-citations"],
        reviewNotes: "Use for a calm Nora revisit; avoid generic RAG 101 and keep the post anchored to citation review."
      },
      {
        id: "note-inference-cost-platform-texture",
        contentBriefId: "brief-agentic-feed-foundation",
        sourceTitle: "Inference cost is platform texture for model gateways",
        sourceUrl: null,
        summary:
          "Model gateway thinking becomes more production-real when routing, latency, provider choice, and cost are visible next to policy and traces.",
        claims: [
          "Inference cost can run as a parallel track beside gateway architecture.",
          "Routing and latency tradeoffs make platform posts feel more like production systems.",
          "A Theo challenge should broaden intuition without derailing the current arc."
        ],
        relatedConceptSlugs: ["inference-cost", "model-gateways"],
        reviewNotes: "Use for Theo; keep the economic frame blunt, concrete, and adjacent."
      }
    ],
    agenticPostIntents: [
      {
        id: "intent-maya-gateway-confidence",
        learnerId: demoLearnerId,
        tutorId: "maya",
        contentBriefId: "brief-agentic-feed-foundation",
        status: "planned" as const,
        feedMove: "confidence_boost" as const,
        noveltyLevel: "familiar" as const,
        targetConceptSlugs: ["model-gateways"],
        relatedConceptSlugs: ["platform-apis", "golden-paths"],
        landingHypothesis:
          "Norman already understands model gateways, so a crisp Maya diagram should feel like an easy win while reinforcing his platform instincts.",
        expectedLearnerEffect: "Reinforce fluency and create the satisfying feeling of recognizing a pattern he already knows.",
        expectedSeenProbability: 82,
        expectedSaveProbability: 42,
        suggestedPostKind: "diagram" as const,
        voiceNotes: "Maya should sound pragmatic and systems-minded, more paved-road critique than curriculum step.",
        riskNotes: "Keep it rewarding, not remedial; avoid implying the learner is stuck on gateways."
      },
      {
        id: "intent-sam-agent-permission-leap",
        learnerId: demoLearnerId,
        tutorId: "sam",
        contentBriefId: "brief-agentic-feed-foundation",
        status: "planned" as const,
        feedMove: "leap" as const,
        noveltyLevel: "leap" as const,
        targetConceptSlugs: ["agent-permissions", "tool-safety"],
        relatedConceptSlugs: ["agent-workflows"],
        landingHypothesis:
          "Even though agent permissions are ahead of the current arc, Sam can make the risk vivid enough to open a future security lane.",
        expectedLearnerEffect: "Spark curiosity about policy boundaries and seed a future track without requiring immediate mastery.",
        expectedSeenProbability: 58,
        expectedSaveProbability: 24,
        suggestedPostKind: "poll" as const,
        voiceNotes: "Sam should be adversarial and concise: name the confused-deputy failure before teaching the abstraction.",
        riskNotes: "Use this sparingly; it is meant to be a horizon-expanding leap, not the dominant feed mode."
      },
      {
        id: "intent-theo-inference-parallel",
        learnerId: demoLearnerId,
        tutorId: "theo",
        contentBriefId: "brief-agentic-feed-foundation",
        status: "planned" as const,
        feedMove: "parallel_track" as const,
        noveltyLevel: "adjacent" as const,
        targetConceptSlugs: ["inference-cost"],
        relatedConceptSlugs: ["model-gateways"],
        landingHypothesis:
          "The learner is thinking in model-gateway terms; a Theo post about inference cost broadens that platform picture without depending on a strict prerequisite chain.",
        expectedLearnerEffect: "Broaden production intuition by placing price, latency, and routing beside gateway design.",
        expectedSeenProbability: 66,
        expectedSaveProbability: 31,
        suggestedPostKind: "challenge" as const,
        voiceNotes: "Theo should be blunt and economic: every architecture choice gets a bill.",
        riskNotes: "Do not let the cost angle derail the current AI systems arc; keep it adjacent and concrete."
      },
      {
        id: "intent-nora-vector-revisit",
        learnerId: demoLearnerId,
        tutorId: "nora",
        contentBriefId: "brief-agentic-feed-foundation",
        status: "planned" as const,
        feedMove: "revisit" as const,
        noveltyLevel: "adjacent" as const,
        targetConceptSlugs: ["vector-databases"],
        relatedConceptSlugs: ["rag-citations"],
        landingHypothesis:
          "Vector databases are stale for Norman, so Nora can revisit retrieval tradeoffs through citations rather than vector-database hype.",
        expectedLearnerEffect: "Refresh an older concept and connect it back to citation quality in a calm, precise way.",
        expectedSeenProbability: 61,
        expectedSaveProbability: 35,
        suggestedPostKind: "quote" as const,
        voiceNotes: "Nora should stay citation-first and separate retrieval quality from prompt luck.",
        riskNotes: "Avoid sounding like a vendor-neutral database explainer; the post should stay feed-native."
      }
    ],
    follows: ["eval", "maya"].map((tutorId) => ({ learnerId: demoLearnerId, tutorId })),
    savedPosts: ["evals-after-bug", "model-gateway"].map((postId) => ({ learnerId: demoLearnerId, postId })),
    privateNotes: [],
    feedEvents: buildFeedEventRows([
      ...posts.map((post) => ({ learnerId: demoLearnerId, postId: post.id, eventType: "shown" as const })),
      { learnerId: demoLearnerId, postId: "evals-after-bug", eventType: "saved" as const },
      { learnerId: demoLearnerId, postId: "model-gateway", eventType: "saved" as const },
      { learnerId: demoLearnerId, postId: "ai-trace", eventType: "opened" as const },
      { learnerId: demoLearnerId, postId: "retrieval-first", eventType: "revisited" as const },
      { learnerId: demoLearnerId, postId: "rag-poll", eventType: "hidden" as const }
    ]),
    learningStates: [
      {
        learnerId: demoLearnerId,
        title: "Platform × AI Engineering",
        currentArc: "AI systems as platform problems",
        progressPercent: 42,
        focusTopics: ["model gateways", "evals", "AI observability"],
        lastSignal: "Saved model gateway + eval release gates"
      }
    ],
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
