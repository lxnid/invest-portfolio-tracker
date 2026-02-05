import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Determine if we're using a local PostgreSQL or Neon
function isLocalPostgres(connectionString: string): boolean {
  return (
    process.env.NODE_ENV === "development" ||
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
    // Dynamically require 'pg' to prevent Cloudflare Workers crash
    // caused by top-level import of Node.js modules
    const { Pool } = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    return drizzle(pool, { schema });
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
