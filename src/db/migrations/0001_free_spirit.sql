CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'anonymous' NOT NULL,
	"type" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_cache" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"data" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"name" varchar(100) NOT NULL,
	"configuration" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"name" varchar(255) NOT NULL,
	"bank_name" varchar(255),
	"type" varchar(50) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'LKR' NOT NULL,
	"start_date" timestamp,
	"maturity_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "created_by" varchar(100) DEFAULT 'system' NOT NULL;