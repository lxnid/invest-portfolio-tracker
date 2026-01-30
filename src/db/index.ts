import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Configure Neon for Cloudflare Workers
// We need to configure the WebSocket constructor for the serverless driver
// to work in non-browser environments like Cloudflare Workers
neonConfig.webSocketConstructor = ws;

// In development/local environment, we create fresh connections per request
// to avoid "Connection terminated unexpectedly" errors from idle timeouts.
// The pool is NOT cached as a singleton because Neon has aggressive idle timeouts.

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create a new Pool for each request context
  // Neon's serverless driver is designed for this pattern
  const pool = new Pool({
    connectionString,
    max: 10, // Maximum connections in the pool
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
    connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  });
  return drizzle(pool, { schema });
}

// Export a proxy that creates a fresh db connection on each access
// This is the recommended pattern for serverless environments with Neon
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const database = createDb();
    const value = (database as any)[prop];
    // Bind methods to the database instance to preserve context
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

export default db;
