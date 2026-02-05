ALTER TABLE "users" ADD COLUMN "verification_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;