CREATE TABLE "learner_learning_states" (
	"learner_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"current_arc" text NOT NULL,
	"progress_percent" integer NOT NULL,
	"focus_topics" text[] NOT NULL,
	"last_signal" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_learning_states" ADD CONSTRAINT "learner_learning_states_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;