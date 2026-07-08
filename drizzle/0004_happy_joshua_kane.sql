CREATE TYPE "public"."concept_familiarity" AS ENUM('unknown', 'seen', 'familiar', 'confident', 'stale');--> statement-breakpoint
CREATE TABLE "learner_concept_states" (
	"learner_id" text NOT NULL,
	"concept_slug" text NOT NULL,
	"label" text NOT NULL,
	"familiarity" "concept_familiarity" NOT NULL,
	"confidence" integer NOT NULL,
	"evidence" text NOT NULL,
	"next_action" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_concept_states_learner_id_concept_slug_pk" PRIMARY KEY("learner_id","concept_slug")
);
--> statement-breakpoint
ALTER TABLE "learner_concept_states" ADD CONSTRAINT "learner_concept_states_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;