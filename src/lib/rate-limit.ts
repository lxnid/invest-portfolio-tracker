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

    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

    // 1. Ensure record exists (Atomic Upsert-if-missing)
    // Uses onConflictDoNothing to handle race condition safely
    await db
      .insert(rateLimits)
      .values({
        key,
        count: 0, // Initialize at 0 so the logic below handles increment
        expiresAt: new Date(0), // Initialize as expired so logic below resets correctly if needed
      })
      .onConflictDoNothing();

    // 2. Atomic Update (Reset or Increment)
    // This handles the race condition where multiple requests see "expired" state simultaneously
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

    // If undefined, it means the row didn't exist despite the insert above (rare edge case with strict isolation?)
    // But onConflictDoNothing should ensure it's there.
    if (!updated) {
      // Fallback or error? Should theoretically not happen if insert worked.
      return { success: false, remaining: 0 };
    }

    if (updated.count > limit) {
      return { success: false, remaining: 0 };
    }

    return {
      success: true,
      remaining: Math.max(0, limit - updated.count),
    };
  }
}
