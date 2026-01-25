import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Configure Neon for Cloudflare Workers
// Use fetch mode for better compatibility
neonConfig.fetchConnectionCache = true;

// Lazy initialization for Cloudflare Workers compatibility
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create the Neon HTTP client
  const sql = neon(connectionString);
  _db = drizzle(sql, { schema });
  return _db;
}

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const database = getDb();
    const value = (database as any)[prop];
    // Bind methods to the database instance
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export default db;
