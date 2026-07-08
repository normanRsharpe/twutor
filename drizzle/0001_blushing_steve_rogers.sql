ALTER TABLE "tutors" ADD COLUMN "profile_headline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "teaching_style" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "best_for" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "accent_color" text DEFAULT '#38bdf8' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "pinned_post_id" text;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "voice_principles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "preferred_post_formats" text[] DEFAULT '{}'::text[] NOT NULL;