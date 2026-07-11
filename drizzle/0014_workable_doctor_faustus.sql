ALTER TABLE "generated_content_drafts" ADD COLUMN "source_brief_id" text;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD COLUMN "variant_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD COLUMN "review_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD COLUMN "revision_reason" text;--> statement-breakpoint
ALTER TABLE "generated_content_drafts" ADD CONSTRAINT "generated_content_drafts_source_brief_id_content_briefs_id_fk" FOREIGN KEY ("source_brief_id") REFERENCES "public"."content_briefs"("id") ON DELETE set null ON UPDATE no action;