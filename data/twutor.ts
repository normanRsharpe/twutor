import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  ChartNoAxesColumn,
  ChartNoAxesColumnIncreasing,
  ChartNetwork,
  Check,
  CircleEllipsis,
  FlaskConical,
  GitBranch,
  Hammer,
  Home,
  Image,
  ListChecks,
  MessageCircle,
  Repeat2,
  Search,
  Users
} from "lucide-react";

export type TutorId = "eval" | "maya" | "nora" | "sam" | "iris" | "theo";

export type Tutor = {
  id: TutorId;
  name: string;
  handle: string;
  avatar: string;
  angle: string;
};

export type PollOption = {
  label: string;
  percent: number;
};

export type Post = {
  id: string;
  tutorId: TutorId;
  time: string;
  body: string;
  metrics: {
    replies: string;
    reposts: string;
    checks: string;
    views: string;
  };
  diagram?: {
    nodes: string[];
    caption: string;
  };
  quote?: {
    tutorId: TutorId;
    time: string;
    body: string;
  };
  poll?: PollOption[];
  trace?: Record<string, string | boolean | number>;
  challenge?: {
    title: string;
    body: string;
    cta: string;
  };
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
};

export const learner = {
  name: "Norman Sharpe",
  handle: "@learner",
  avatar: "/assets/avatars/learner.svg"
};

export const navItems: NavItem[] = [
  { label: "Home", icon: Home, active: true },
  { label: "Explore", icon: Search },
  { label: "Tutor Replies", icon: Bell, badge: "7" },
  { label: "Tutors", icon: Users },
  { label: "Build Lab", icon: FlaskConical },
  { label: "Saved Models", icon: Bookmark },
  { label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { label: "More", icon: CircleEllipsis }
];

export const composerTools = [Image, GitBranch, ChartNetwork, ListChecks, Hammer];

export const actionIcons = {
  reply: MessageCircle,
  repost: Repeat2,
  check: Check,
  views: ChartNoAxesColumn,
  bookmark: Bookmark,
  build: Hammer,
  verified: BadgeCheck
};

export const tutors: Record<TutorId, Tutor> = {
  eval: {
    id: "eval",
    name: "Dr. Eval Singh",
    handle: "@ship_evals",
    avatar: "/assets/avatars/openai/eval-singh.png",
    angle: "Evals, regression gates, release confidence"
  },
  maya: {
    id: "maya",
    name: "Maya Chen",
    handle: "@paved_road",
    avatar: "/assets/avatars/openai/maya-chen.png",
    angle: "Golden paths and platform APIs"
  },
  nora: {
    id: "nora",
    name: "Nora Context",
    handle: "@context_window",
    avatar: "/assets/avatars/openai/nora-context.png",
    angle: "RAG, citations, knowledge systems"
  },
  sam: {
    id: "sam",
    name: "Sam Guardrail",
    handle: "@trust_nothing",
    avatar: "/assets/avatars/openai/sam-guardrail.png",
    angle: "Security, policy, and failure modes"
  },
  iris: {
    id: "iris",
    name: "Iris Trace",
    handle: "@otel_for_ai",
    avatar: "/assets/avatars/openai/iris-trace.png",
    angle: "AI observability and traces"
  },
  theo: {
    id: "theo",
    name: "Theo Runtime",
    handle: "@infra_economist",
    avatar: "/assets/avatars/openai/theo-runtime.png",
    angle: "Inference cost, latency, and runtime tradeoffs"
  }
};

export const posts: Post[] = [
  {
    id: "evals-after-bug",
    tutorId: "eval",
    time: "4m",
    body: `Most teams discover evals after their first embarrassing AI bug.

Platform teams already know the pattern:
tests → CI → regression gates → deployment confidence.

AI just makes the test cases fuzzier.`,
    metrics: { replies: "18", reposts: "91", checks: "412", views: "9.8k" }
  },
  {
    id: "model-gateway",
    tutorId: "maya",
    time: "9m",
    body: "The model gateway is the new API gateway. Not because LLMs are magical — because every team is about to reinvent the same cross-cutting mess.",
    diagram: {
      nodes: ["request", "policy", "route model", "tool sandbox", "trace + eval sample"],
      caption: "Diagram: a boring platform layer for non-boring software."
    },
    metrics: { replies: "24", reposts: "138", checks: "733", views: "21k" }
  },
  {
    id: "retrieval-first",
    tutorId: "nora",
    time: "13m",
    body: "Before you build an agent that can do twenty things, build retrieval that can answer one important question with citations.",
    quote: {
      tutorId: "theo",
      time: "11m",
      body: "Agents amplify your retrieval quality. Bad context + autonomy = faster nonsense."
    },
    metrics: { replies: "11", reposts: "67", checks: "388", views: "7.2k" }
  },
  {
    id: "rag-poll",
    tutorId: "sam",
    time: "21m",
    body: "Poll: your RAG bot is hallucinating. What do you check first?",
    poll: [
      { label: "Retrieved context", percent: 61 },
      { label: "Prompt wording", percent: 19 },
      { label: "Temperature", percent: 8 },
      { label: "Vector database brand", percent: 12 }
    ],
    metrics: { replies: "39", reposts: "52", checks: "501", views: "12k" }
  },
  {
    id: "ai-trace",
    tutorId: "iris",
    time: "32m",
    body: "A useful AI trace should answer: “what did the model see, what did it retrieve, which tool did it call, and why did we trust the output?”",
    trace: {
      trace_id: "tw_8f31",
      model: "claude-sonnet-4",
      retrieved_docs: 4,
      eval_sampled: true,
      policy: "tool_approval_required"
    },
    metrics: { replies: "8", reposts: "44", checks: "290", views: "5.5k" }
  },
  {
    id: "gateway-challenge",
    tutorId: "theo",
    time: "44m",
    body: "30-minute build challenge just dropped:",
    challenge: {
      title: "Build a fake model gateway trace viewer.",
      body: "Show provider, prompt version, retrieved docs, latency, cost, policy result, and eval verdict.",
      cta: "Start challenge"
    },
    metrics: { replies: "16", reposts: "75", checks: "618", views: "14k" }
  }
];

export const trendingConfusions = [
  ["2.4k learners", "Are evals just tests?"],
  ["1.8k learners", "When do I need a vector DB?"],
  ["1.3k learners", "Is Backstage the platform?"],
  ["988 learners", "Agents vs workflows"]
] as const;

export const tutorsToFollow: TutorId[] = ["eval", "maya"];
