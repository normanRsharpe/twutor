CREATE TABLE "admin_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_auth_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"outcome" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_actor_auth_user_id_auth_users_id_fk" FOREIGN KEY ("actor_auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE restrict ON UPDATE no action;