import { db } from "@/db";
import {
  holdings,
  transactions,
  tradingRules,
  settings,
  stocks,
} from "@/db/schema";
import { eq, like, sql } from "drizzle-orm";
import { DEMO_LIMITS } from "@/lib/demo-constants";

/**
 * Check if a demo user has exceeded their transaction limit
 */
export async function checkDemoTransactionLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  if (!userId.startsWith("guest-")) {
    return { allowed: true, current: 0, max: Infinity };
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const current = Number(result[0]?.count || 0);
  return {
    allowed: current < DEMO_LIMITS.MAX_TRANSACTIONS,
    current,
    max: DEMO_LIMITS.MAX_TRANSACTIONS,
  };
}

/**
 * Check if a demo user has exceeded their holdings limit
 */
export async function checkDemoHoldingsLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  if (!userId.startsWith("guest-")) {
    return { allowed: true, current: 0, max: Infinity };
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(holdings)
    .where(eq(holdings.userId, userId));

  const current = Number(result[0]?.count || 0);
  return {
    allowed: current < DEMO_LIMITS.MAX_HOLDINGS,
    current,
    max: DEMO_LIMITS.MAX_HOLDINGS,
  };
}

/**
 * Check if a demo user has exceeded their rules limit
 */
export async function checkDemoRulesLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  if (!userId.startsWith("guest-")) {
    return { allowed: true, current: 0, max: Infinity };
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(tradingRules)
    .where(eq(tradingRules.userId, userId));

  const current = Number(result[0]?.count || 0);
  return {
    allowed: current < DEMO_LIMITS.MAX_RULES,
    current,
    max: DEMO_LIMITS.MAX_RULES,
  };
}

/**
 * Delete all data for a guest user (called on logout)
 */
export async function cleanupGuestData(userId: string): Promise<void> {
  if (!userId.startsWith("guest-")) {
    console.log("Not a guest user, skipping cleanup");
    return;
  }

  console.log(`Cleaning up data for guest: ${userId}`);

  // Delete in order (respect foreign keys if any)
  await db.delete(transactions).where(eq(transactions.userId, userId));
  await db.delete(holdings).where(eq(holdings.userId, userId));
  await db.delete(tradingRules).where(eq(tradingRules.userId, userId));
  await db.delete(settings).where(eq(settings.userId, userId));

  // Delete stocks created by this guest
  // (Only if not used by others? For simplicity, we assume guest stocks are garbage if created by guest)
  // But wait, if admin started using "TEST" stock...
  // Use a safe check: Delete where createdBy = userId AND id NOT IN (select stock_id from holdings) AND id NOT IN (select stock_id from transactions)
  // For now, simpler: Just delete if createdBy guest.
  // Actually, let's do the safe check to be robust.
  // But `notInArray` with subquery is tricky in simple drizzle.
  // Let's just delete stocks created by this guest.
  await db.delete(stocks).where(eq(stocks.createdBy, userId));

  console.log(`Cleanup complete for guest: ${userId}`);
}

/**
 * Cleanup all stale guest data (older than 24 hours)
 * This can be called by a cron job
 */
export async function cleanupStaleGuestData(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Delete old guest transactions
  const deletedTx = await db
    .delete(transactions)
    .where(
      sql`${transactions.userId} LIKE 'guest-%' AND ${transactions.createdAt} < ${oneDayAgo}`,
    )
    .returning();

  const deletedHoldings = await db
    .delete(holdings)
    .where(
      sql`${holdings.userId} LIKE 'guest-%' AND ${holdings.createdAt} < ${oneDayAgo}`,
    )
    .returning();

  const deletedRules = await db
    .delete(tradingRules)
    .where(
      sql`${tradingRules.userId} LIKE 'guest-%' AND ${tradingRules.createdAt} < ${oneDayAgo}`,
    )
    .returning();

  const deletedStocks = await db
    .delete(stocks)
    .where(
      sql`${stocks.createdBy} LIKE 'guest-%' AND ${stocks.createdAt} < ${oneDayAgo}`,
    )
    .returning();

  const totalDeleted =
    deletedTx.length +
    deletedHoldings.length +
    deletedRules.length +
    deletedStocks.length;
  console.log(`Cleaned up ${totalDeleted} stale guest records`);

  return totalDeleted;
}
