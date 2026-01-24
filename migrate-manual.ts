import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "capital" numeric(15, 2) DEFAULT '0' NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created/Verified settings table");

    // Transactions table updates
    // Check if column exists to avoid errors on re-run
    await db.execute(sql`
      ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE varchar(10);
    `);
    console.log("Updated transactions type");

    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='date') THEN
              ALTER TABLE "transactions" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;
          END IF;
      END $$;
    `);
    console.log("Added date column");

    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='updated_at') THEN
              ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
          END IF;
      END $$;
    `);
    console.log("Added updated_at column");

    // Drop columns if they exist
    await db.execute(sql`
      ALTER TABLE "transactions" DROP COLUMN IF EXISTS "fees";
      ALTER TABLE "transactions" DROP COLUMN IF EXISTS "total_amount";
      ALTER TABLE "transactions" DROP COLUMN IF EXISTS "executed_at";
    `);
    console.log("Dropped legacy columns");

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
