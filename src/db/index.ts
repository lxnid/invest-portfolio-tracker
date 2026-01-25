import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Configure Neon for Cloudflare Workers
// We need to configure the WebSocket constructor for the serverless driver
// to work in non-browser environments like Cloudflare Workers
neonConfig.webSocketConstructor = ws;

// Lazy initialization for Cloudflare Workers compatibility
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create the Neon WebSocket Pool
  const pool = new Pool({ connectionString });
  _db = drizzle(pool, { schema });
  return _db;
}

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const database = getDb();
    const value = (database as any)[prop];
    // Bind methods to the database instance to preserve context
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export default db;
