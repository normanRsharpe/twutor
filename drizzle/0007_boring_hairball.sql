CREATE TYPE "public"."feed_event_type" AS ENUM('shown', 'opened', 'saved', 'unsaved', 'hidden', 'dismissed', 'revisited');--> statement-breakpoint
CREATE TABLE "feed_events" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"agentic_post_intent_id" text,
	"event_type" "feed_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_agentic_post_intent_id_agentic_post_intents_id_fk" FOREIGN KEY ("agentic_post_intent_id") REFERENCES "public"."agentic_post_intents"("id") ON DELETE set null ON UPDATE no action;