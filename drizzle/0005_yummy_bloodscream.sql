CREATE TYPE "public"."agentic_feed_move" AS ENUM('bridge', 'introduce', 'revisit', 'deepen', 'apply', 'confidence_boost', 'leap', 'parallel_track', 'serendipity');--> statement-breakpoint
CREATE TYPE "public"."agentic_novelty_level" AS ENUM('familiar', 'adjacent', 'stretch', 'leap');--> statement-breakpoint
CREATE TYPE "public"."agentic_post_intent_status" AS ENUM('planned', 'published', 'retired');--> statement-breakpoint
CREATE TABLE "agentic_post_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"tutor_id" text NOT NULL,
	"status" "agentic_post_intent_status" DEFAULT 'planned' NOT NULL,
	"feed_move" "agentic_feed_move" NOT NULL,
	"novelty_level" "agentic_novelty_level" NOT NULL,
	"target_concept_slugs" text[] NOT NULL,
	"related_concept_slugs" text[] NOT NULL,
	"landing_hypothesis" text NOT NULL,
	"expected_learner_effect" text NOT NULL,
	"expected_seen_probability" integer NOT NULL,
	"expected_save_probability" integer NOT NULL,
	"suggested_post_kind" "post_kind" NOT NULL,
	"voice_notes" text NOT NULL,
	"risk_notes" text NOT NULL,
	"published_post_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentic_post_intents" ADD CONSTRAINT "agentic_post_intents_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentic_post_intents" ADD CONSTRAINT "agentic_post_intents_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentic_post_intents" ADD CONSTRAINT "agentic_post_intents_published_post_id_posts_id_fk" FOREIGN KEY ("published_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;