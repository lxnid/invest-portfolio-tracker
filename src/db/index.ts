import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "./schema";

// Configure Neon for Cloudflare Workers
// We need to configure the WebSocket constructor for the serverless driver
// to work in non-browser environments like Cloudflare Workers
neonConfig.webSocketConstructor = ws;

// Determine if we're using a local PostgreSQL or Neon
function isLocalPostgres(connectionString: string): boolean {
  return (
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  );
}

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Use standard pg driver for local development, Neon for production
  if (isLocalPostgres(connectionString)) {
    const pool = new PgPool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    return drizzlePg(pool, { schema });
  }

  // Use Neon serverless driver for production
  const pool = new NeonPool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return drizzleNeon(pool, { schema });
}

// Export a proxy that creates a fresh db connection on each access
// This is the recommended pattern for serverless environments with Neon
export const db = new Proxy({} as ReturnType<typeof drizzleNeon>, {
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
