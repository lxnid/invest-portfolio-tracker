import { drizzle } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Check if we are using Neon
const isNeon = connectionString.includes("neon.tech");

// Configure WebSocket for Node environment if using Neon
if (isNeon) {
  neonConfig.webSocketConstructor = ws;
}

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleNeon>;

if (isNeon) {
  const pool = new NeonPool({ connectionString });
  db = drizzleNeon(pool, { schema });
} else {
  const pool = new PgPool({
    connectionString,
  });
  db = drizzle(pool, { schema });
}

export { db };
export default db;
