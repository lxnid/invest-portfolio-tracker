import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running security migration...");
  try {
    // Rate Limits Table
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "rate_limits" (
            "key" varchar(255) PRIMARY KEY NOT NULL,
            "count" integer DEFAULT 0 NOT NULL,
            "expires_at" timestamp NOT NULL
        );
     `);
    console.log("Created rate_limits table");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}
main();
