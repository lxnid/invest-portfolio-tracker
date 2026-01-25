CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"stock_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"avg_buy_price" numeric(15, 2) NOT NULL,
	"initial_buy_price" numeric(15, 2),
	"last_buy_price" numeric(15, 2),
	"total_invested" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"capital" numeric(15, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(100),
	"logo_path" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stocks_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "trading_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"rule_type" varchar(50) NOT NULL,
	"threshold" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) DEFAULT 'admin-user' NOT NULL,
	"stock_id" integer NOT NULL,
	"type" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"fees" numeric(15, 2) DEFAULT '0' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;