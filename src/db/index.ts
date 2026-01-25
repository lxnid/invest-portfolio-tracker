import { drizzle } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Lazy-initialize the database connection to avoid build-time errors
// when DATABASE_URL is not set (e.g., during static page generation)
let _db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleNeon> | null =
  null;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Check if we are using Neon
  const isNeon = connectionString.includes("neon.tech");

  // Configure WebSocket for Node environment if using Neon
  if (isNeon) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString });
    _db = drizzleNeon(pool, { schema });
  } else {
    const pool = new PgPool({ connectionString });
    _db = drizzle(pool, { schema });
  }

  return _db;
}

// Export a proxy that lazily initializes the db on first access
const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { db };
export default db;
