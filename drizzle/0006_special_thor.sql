CREATE TYPE "public"."content_brief_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "content_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"status" "content_brief_status" DEFAULT 'draft' NOT NULL,
	"theme" text NOT NULL,
	"objective" text NOT NULL,
	"target_concept_slugs" text[] NOT NULL,
	"revisit_concept_slugs" text[] NOT NULL,
	"avoid_concept_slugs" text[] NOT NULL,
	"desired_post_mix" jsonb NOT NULL,
	"learner_context_snapshot" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"content_brief_id" text NOT NULL,
	"source_title" text NOT NULL,
	"source_url" text,
	"summary" text NOT NULL,
	"claims" text[] NOT NULL,
	"related_concept_slugs" text[] NOT NULL,
	"review_notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agentic_post_intents" ADD COLUMN "content_brief_id" text;--> statement-breakpoint
ALTER TABLE "content_briefs" ADD CONSTRAINT "content_briefs_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_content_brief_id_content_briefs_id_fk" FOREIGN KEY ("content_brief_id") REFERENCES "public"."content_briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentic_post_intents" ADD CONSTRAINT "agentic_post_intents_content_brief_id_content_briefs_id_fk" FOREIGN KEY ("content_brief_id") REFERENCES "public"."content_briefs"("id") ON DELETE set null ON UPDATE no action;