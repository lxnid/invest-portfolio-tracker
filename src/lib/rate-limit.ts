import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, lt, sql } from "drizzle-orm";

export class RateLimiter {
  /**
   * Check if a key is rate limited.
   * @param key Unique identifier (IP or User ID)
   * @param limit Max requests allowed
   * @param windowSeconds Time window in seconds
   * @returns { success: boolean, remaining: number }
   */
  static async check(key: string, limit: number, windowSeconds: number) {
    const now = new Date();

    // Clean up expired entries (lazy cleanup)
    // In a real app, a cron job might be better, but this ensures we don't store junk forever
    // Optimization: only delete specifically for this key or periodically
    // For now, let's just handle the logic for the *current* key

    // Transactional logic to ensure atomicity
    // Since we are using Drizzle with potential Neon, we might not have full transaction support easily on HTTP?
    // But Neon supports it. Let's try simple logic first.

    // 4. Fail-Open Strategy
    // If rate limiting fails (DB down, misconfigured), allow the request to proceed.
    // This prevents login/signup from taking down the app during DB issues.
    try {
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

      // 1. Ensure record exists (Atomic Upsert-if-missing)
      await db
        .insert(rateLimits)
        .values({
          key,
          count: 0,
          expiresAt: new Date(0),
        })
        .onConflictDoNothing();

      // 2. Atomic Update (Reset or Increment)
      const [updated] = await db
        .update(rateLimits)
        .set({
          count: sql`
          CASE 
            WHEN ${rateLimits.expiresAt} < ${now} THEN 1 
            ELSE ${rateLimits.count} + 1 
          END
        `,
          expiresAt: sql`
          CASE 
            WHEN ${rateLimits.expiresAt} < ${now} THEN ${expiresAt} 
            ELSE ${rateLimits.expiresAt} 
          END
        `,
        })
        .where(eq(rateLimits.key, key))
        .returning();

      if (!updated) {
        return { success: false, remaining: 0 };
      }

      if (updated.count > limit) {
        return { success: false, remaining: 0 };
      }

      return {
        success: true,
        remaining: Math.max(0, limit - updated.count),
      };
    } catch (error) {
      console.warn("RateLimiter failed (Fail-Open):", error);
      // Fail open: allow the request if rate limiting system is down
      return { success: true, remaining: 1 };
    }
  }
}
