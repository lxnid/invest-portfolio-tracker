import { createRequire } from "module";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Determine if we're using a local PostgreSQL or Neon
function isLocalPostgres(connectionString: string): boolean {
  // STRICT SAFETY: Force false in production to prevent loading 'pg'/eval imports
  if (process.env.NODE_ENV === "production") {
    return false;
  }

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
    // caused by top-level import of Node.js modules.
    // Using eval('require') is the only way to definitely force bundlers (like esbuild)
    // to ignore this dependency and treat it as purely runtime.
    const require = eval("require");

    const pgPkg = "pg";
    const drizzlePgPkg = "drizzle-orm/node-postgres";

    try {
      const { Pool } = require(pgPkg);
      const { drizzle } = require(drizzlePgPkg);

      const pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      return drizzle(pool, { schema });
    } catch (e) {
      console.error("Failed to require pg driver:", e);
      throw e;
    }
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
