import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables immediately
dotenv.config({ path: ".env.local" });

async function runMigration() {
  console.log("Starting manual migration...");

  // Import db AFTER loading env vars
  const { db } = await import("../db");

  try {
    // 1. Settings
    console.log("Migrating settings...");
    await db.execute(
      sql`ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "user_id" varchar(100) DEFAULT 'admin-user' NOT NULL;`,
    );

    // 2. Trading Rules
    console.log("Migrating trading_rules...");
    await db.execute(
      sql`ALTER TABLE "trading_rules" ADD COLUMN IF NOT EXISTS "user_id" varchar(100) DEFAULT 'admin-user' NOT NULL;`,
    );

    // 3. Holdings
    console.log("Migrating holdings...");
    await db.execute(
      sql`ALTER TABLE "holdings" ADD COLUMN IF NOT EXISTS "user_id" varchar(100) DEFAULT 'admin-user' NOT NULL;`,
    );

    // 4. Transactions
    console.log("Migrating transactions...");
    await db.execute(
      sql`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "user_id" varchar(100) DEFAULT 'admin-user' NOT NULL;`,
    );

    // 5. Stocks (for tracking guest creations)
    console.log("Migrating stocks...");
    await db.execute(
      sql`ALTER TABLE "stocks" ADD COLUMN IF NOT EXISTS "created_by" varchar(100) DEFAULT 'system' NOT NULL;`,
    );

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
