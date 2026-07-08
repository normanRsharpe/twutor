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

export const learnerLearningStates = pgTable("learner_learning_states", {
  learnerId: text("learner_id").primaryKey().references(() => learners.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  currentArc: text("current_arc").notNull(),
  progressPercent: integer("progress_percent").notNull(),
  focusTopics: text("focus_topics").array().notNull(),
  lastSignal: text("last_signal").notNull(),
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
