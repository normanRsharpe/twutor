import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp
} from "drizzle-orm/pg-core";

export const postKindEnum = pgEnum("post_kind", ["text", "diagram", "quote", "poll", "trace", "challenge"]);
export const assetOwnerEnum = pgEnum("asset_owner", ["tutor", "post", "challenge"]);
export const conceptFamiliarityEnum = pgEnum("concept_familiarity", ["unknown", "seen", "familiar", "confident", "stale"]);
export const contentBriefStatusEnum = pgEnum("content_brief_status", ["draft", "active", "archived"]);
export const feedEventTypeEnum = pgEnum("feed_event_type", ["shown", "opened", "saved", "unsaved", "hidden", "dismissed", "revisited"]);
export const agenticPostIntentStatusEnum = pgEnum("agentic_post_intent_status", ["planned", "published", "retired"]);
export const askTutorResponseStatusEnum = pgEnum("ask_tutor_response_status", ["draft", "published"]);
export const generatedContentStatusEnum = pgEnum("generated_content_status", ["draft", "published", "archived"]);
export const agenticFeedMoveEnum = pgEnum("agentic_feed_move", [
  "bridge",
  "introduce",
  "revisit",
  "deepen",
  "apply",
  "confidence_boost",
  "leap",
  "parallel_track",
  "serendipity"
]);
export const agenticNoveltyLevelEnum = pgEnum("agentic_novelty_level", ["familiar", "adjacent", "stretch", "leap"]);

export const learners = pgTable("learners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  avatarUrl: text("avatar_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const tutors = pgTable("tutors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  avatarUrl: text("avatar_url").notNull(),
  bio: text("bio").notNull(),
  angle: text("angle").notNull(),
  specialtyTags: text("specialty_tags").array().notNull(),
  profileHeadline: text("profile_headline").notNull(),
  teachingStyle: text("teaching_style").notNull(),
  bestFor: text("best_for").notNull(),
  accentColor: text("accent_color").notNull(),
  pinnedPostId: text("pinned_post_id"),
  voicePrinciples: text("voice_principles").array().notNull(),
  preferredPostFormats: text("preferred_post_formats").array().notNull(),
  isVerified: boolean("is_verified").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const tutorFollows = pgTable(
  "tutor_follows",
  {
    learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.learnerId, table.tutorId] }) })
);

export const learnerSavedPosts = pgTable(
  "learner_saved_posts",
  {
    learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.learnerId, table.postId] }) })
);

export const feedEvents = pgTable("feed_events", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  agenticPostIntentId: text("agentic_post_intent_id").references(() => agenticPostIntents.id, { onDelete: "set null" }),
  eventType: feedEventTypeEnum("event_type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull()
});

export const learnerLearningStates = pgTable("learner_learning_states", {
  learnerId: text("learner_id").primaryKey().references(() => learners.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  currentArc: text("current_arc").notNull(),
  progressPercent: integer("progress_percent").notNull(),
  focusTopics: text("focus_topics").array().notNull(),
  lastSignal: text("last_signal").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const learnerPrivateNotes = pgTable("learner_private_notes", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const askTutorQuestions = pgTable("ask_tutor_questions", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const askTutorResponses = pgTable("ask_tutor_responses", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => askTutorQuestions.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
  status: askTutorResponseStatusEnum("status").default("draft").notNull(),
  body: text("body").notNull(),
  guardrails: text("guardrails").array().notNull(),
  followUpPrompt: text("follow_up_prompt").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const learnerConceptStates = pgTable(
  "learner_concept_states",
  {
    learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    conceptSlug: text("concept_slug").notNull(),
    label: text("label").notNull(),
    familiarity: conceptFamiliarityEnum("familiarity").notNull(),
    confidence: integer("confidence").notNull(),
    evidence: text("evidence").notNull(),
    nextAction: text("next_action").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.learnerId, table.conceptSlug] }) })
);

export const contentBriefs = pgTable("content_briefs", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  status: contentBriefStatusEnum("status").default("draft").notNull(),
  theme: text("theme").notNull(),
  objective: text("objective").notNull(),
  targetConceptSlugs: text("target_concept_slugs").array().notNull(),
  revisitConceptSlugs: text("revisit_concept_slugs").array().notNull(),
  avoidConceptSlugs: text("avoid_concept_slugs").array().notNull(),
  desiredPostMix: jsonb("desired_post_mix").$type<{ feedMove: string; count: number; rationale: string }[]>().notNull(),
  learnerContextSnapshot: text("learner_context_snapshot").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const researchNotes = pgTable("research_notes", {
  id: text("id").primaryKey(),
  contentBriefId: text("content_brief_id").notNull().references(() => contentBriefs.id, { onDelete: "cascade" }),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url"),
  summary: text("summary").notNull(),
  claims: text("claims").array().notNull(),
  relatedConceptSlugs: text("related_concept_slugs").array().notNull(),
  reviewNotes: text("review_notes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const agenticPostIntents = pgTable("agentic_post_intents", {
  id: text("id").primaryKey(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
  contentBriefId: text("content_brief_id").references(() => contentBriefs.id, { onDelete: "set null" }),
  status: agenticPostIntentStatusEnum("status").default("planned").notNull(),
  feedMove: agenticFeedMoveEnum("feed_move").notNull(),
  noveltyLevel: agenticNoveltyLevelEnum("novelty_level").notNull(),
  targetConceptSlugs: text("target_concept_slugs").array().notNull(),
  relatedConceptSlugs: text("related_concept_slugs").array().notNull(),
  landingHypothesis: text("landing_hypothesis").notNull(),
  expectedLearnerEffect: text("expected_learner_effect").notNull(),
  expectedSeenProbability: integer("expected_seen_probability").notNull(),
  expectedSaveProbability: integer("expected_save_probability").notNull(),
  suggestedPostKind: postKindEnum("suggested_post_kind").notNull(),
  voiceNotes: text("voice_notes").notNull(),
  riskNotes: text("risk_notes").notNull(),
  publishedPostId: text("published_post_id").references(() => posts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const generatedAssets = pgTable("generated_assets", {
  id: text("id").primaryKey(),
  ownerType: assetOwnerEnum("owner_type").notNull(),
  ownerId: text("owner_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model"),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const generatedContentDrafts = pgTable("generated_content_drafts", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
  kind: postKindEnum("kind").notNull(),
  status: generatedContentStatusEnum("status").default("draft").notNull(),
  theme: text("theme").notNull(),
  prompt: text("prompt").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  publishedPostId: text("published_post_id").references(() => posts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
  kind: postKindEnum("kind").notNull(),
  body: text("body").notNull(),
  timeLabel: text("time_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull()
});

export const postMetrics = pgTable("post_metrics", {
  postId: text("post_id").primaryKey().references(() => posts.id, { onDelete: "cascade" }),
  replies: text("replies").notNull(),
  reposts: text("reposts").notNull(),
  checks: text("checks").notNull(),
  views: text("views").notNull()
});

export const diagramNodes = pgTable(
  "diagram_nodes",
  {
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    caption: text("caption").notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.postId, table.position] }) })
);

export const quotePosts = pgTable("quote_posts", {
  postId: text("post_id").primaryKey().references(() => posts.id, { onDelete: "cascade" }),
  tutorId: text("tutor_id").notNull().references(() => tutors.id, { onDelete: "cascade" }),
  timeLabel: text("time_label").notNull(),
  body: text("body").notNull()
});

export const pollOptions = pgTable(
  "poll_options",
  {
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    percent: integer("percent").notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.postId, table.position] }) })
);

export const traceCards = pgTable("trace_cards", {
  postId: text("post_id").primaryKey().references(() => posts.id, { onDelete: "cascade" }),
  payload: jsonb("payload").$type<Record<string, string | boolean | number>>().notNull()
});

export const challenges = pgTable("challenges", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().unique().references(() => posts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  cta: text("cta").notNull()
});

export const tutorRelations = relations(tutors, ({ many }) => ({
  posts: many(posts),
  follows: many(tutorFollows)
}));

export const postRelations = relations(posts, ({ one, many }) => ({
  tutor: one(tutors, { fields: [posts.tutorId], references: [tutors.id] }),
  metrics: one(postMetrics, { fields: [posts.id], references: [postMetrics.postId] }),
  diagramNodes: many(diagramNodes),
  quote: one(quotePosts, { fields: [posts.id], references: [quotePosts.postId] }),
  pollOptions: many(pollOptions),
  trace: one(traceCards, { fields: [posts.id], references: [traceCards.postId] }),
  challenge: one(challenges, { fields: [posts.id], references: [challenges.postId] })
}));
