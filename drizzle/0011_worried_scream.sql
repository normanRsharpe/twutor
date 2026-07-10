CREATE TABLE "learner_onboardings" (
	"learner_id" text PRIMARY KEY NOT NULL,
	"goal" text,
	"level" text,
	"cadence" text,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"tutor_ids" text[] DEFAULT '{}' NOT NULL,
	"completed_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_onboardings" ADD CONSTRAINT "learner_onboardings_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;