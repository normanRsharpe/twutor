CREATE TABLE "social_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_poll_votes" (
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"option_position" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_poll_votes_learner_id_post_id_pk" PRIMARY KEY("learner_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "social_quote_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"post_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_poll_votes" ADD CONSTRAINT "social_poll_votes_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_poll_votes" ADD CONSTRAINT "social_poll_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_quote_posts" ADD CONSTRAINT "social_quote_posts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_quote_posts" ADD CONSTRAINT "social_quote_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reactions" ADD CONSTRAINT "social_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_replies" ADD CONSTRAINT "social_replies_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_replies" ADD CONSTRAINT "social_replies_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "social_reactions_learner_post_reaction_unique" ON "social_reactions" USING btree ("learner_id","post_id","reaction_type");