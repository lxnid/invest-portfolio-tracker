import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Use Neon serverless driver for all environments
  const pool = new NeonPool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return drizzleNeon(pool, { schema });
}

// Cache the database instance to prevent connection exhaustion
let cachedDb: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    if (!cachedDb) {
      cachedDb = createDb();
    }
    const value = (cachedDb as any)[prop];
    // Bind methods to the database instance to preserve context
    if (typeof value === "function") {
      return value.bind(cachedDb);
    }
    return value;
  },
});

export default db;
