CREATE TYPE "public"."asset_owner" AS ENUM('tutor', 'post', 'challenge');--> statement-breakpoint
CREATE TYPE "public"."post_kind" AS ENUM('text', 'diagram', 'quote', 'poll', 'trace', 'challenge');--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cta" text NOT NULL,
	CONSTRAINT "challenges_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "diagram_nodes" (
	"post_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"caption" text NOT NULL,
	CONSTRAINT "diagram_nodes_post_id_position_pk" PRIMARY KEY("post_id","position")
);
--> statement-breakpoint
CREATE TABLE "generated_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_type" "asset_owner" NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text NOT NULL,
	"model" text,
	"prompt" text NOT NULL,
	"url" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"handle" text NOT NULL,
	"avatar_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learners_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"post_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"percent" integer NOT NULL,
	CONSTRAINT "poll_options_post_id_position_pk" PRIMARY KEY("post_id","position")
);
--> statement-breakpoint
CREATE TABLE "post_metrics" (
	"post_id" text PRIMARY KEY NOT NULL,
	"replies" text NOT NULL,
	"reposts" text NOT NULL,
	"checks" text NOT NULL,
	"views" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text NOT NULL,
	"kind" "post_kind" NOT NULL,
	"body" text NOT NULL,
	"time_label" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_posts" (
	"post_id" text PRIMARY KEY NOT NULL,
	"tutor_id" text NOT NULL,
	"time_label" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_cards" (
	"post_id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_follows" (
	"learner_id" text NOT NULL,
	"tutor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_follows_learner_id_tutor_id_pk" PRIMARY KEY("learner_id","tutor_id")
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"handle" text NOT NULL,
	"avatar_url" text NOT NULL,
	"bio" text NOT NULL,
	"angle" text NOT NULL,
	"specialty_tags" text[] NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutors_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagram_nodes" ADD CONSTRAINT "diagram_nodes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_metrics" ADD CONSTRAINT "post_metrics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_posts" ADD CONSTRAINT "quote_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_posts" ADD CONSTRAINT "quote_posts_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_cards" ADD CONSTRAINT "trace_cards_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_follows" ADD CONSTRAINT "tutor_follows_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_follows" ADD CONSTRAINT "tutor_follows_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;