import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration...");

  try {
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='holdings' AND column_name='status') THEN
              ALTER TABLE "holdings" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;
          END IF;
      END $$;
    `);
    console.log("Added status column to holdings");

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
