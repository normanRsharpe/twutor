CREATE TYPE "public"."ask_tutor_response_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."generated_content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "ask_tutor_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"question" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_tutor_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"tutor_id" text NOT NULL,
	"status" "ask_tutor_response_status" DEFAULT 'draft' NOT NULL,
	"body" text NOT NULL,
	"guardrails" text[] NOT NULL,
	"follow_up_prompt" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_content_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text NOT NULL,
	"kind" "post_kind" NOT NULL,
	"status" "generated_content_status" DEFAULT 'draft' NOT NULL,
	"theme" text NOT NULL,
	"prompt" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_post_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_private_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ask_tutor_questions" ADD CONSTRAINT "ask_tutor_questions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_tutor_responses" ADD CONSTRAINT "ask_tutor_responses_question_id_ask_tutor_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."ask_tutor_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_tutor_responses" ADD CONSTRAINT "ask_tutor_responses_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD CONSTRAINT "generated_content_drafts_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD CONSTRAINT "generated_content_drafts_published_post_id_posts_id_fk" FOREIGN KEY ("published_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_private_notes" ADD CONSTRAINT "learner_private_notes_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;