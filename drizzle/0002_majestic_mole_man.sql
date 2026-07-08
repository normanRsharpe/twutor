CREATE TABLE "learner_saved_posts" (
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_saved_posts_learner_id_post_id_pk" PRIMARY KEY("learner_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "learner_saved_posts" ADD CONSTRAINT "learner_saved_posts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_saved_posts" ADD CONSTRAINT "learner_saved_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;