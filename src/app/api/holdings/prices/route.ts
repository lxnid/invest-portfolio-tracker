import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks, marketCache } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getAllStockPrices, type StockTrade } from "@/lib/cse-api";

export const dynamic = "force-dynamic";

interface PriceData {
  price: number;
  change: number;
  percentChange: number;
  fromCache?: boolean;
  cachedAt?: string;
}

// GET prices only for user's holdings - lightweight alternative to /api/cse/market
// Falls back to cached prices when market is closed (CSE API returns null)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get user's active holdings with stock symbols
    const userHoldings = await db
      .select({
        stockId: holdings.stockId,
        symbol: stocks.symbol,
        quantity: holdings.quantity,
      })
      .from(holdings)
      .innerJoin(stocks, eq(holdings.stockId, stocks.id))
      .where(
        and(eq(holdings.userId, session.userId), eq(holdings.status, "active")),
      );

    if (userHoldings.length === 0) {
      return NextResponse.json({ data: { prices: {}, fromCache: false } });
    }

    // 2. Get unique symbols
    const symbols = Array.from<string>(
      new Set(userHoldings.map((h: any) => h.symbol)),
    );

    // 3. Pre-fetch all cached prices for fallback
    const cacheKeys = symbols.map((s) => `STOCK_${s}`);
    let cachedPrices: Map<string, { data: any; updatedAt: Date }> = new Map();
    try {
      const cachedEntries = await db
        .select()
        .from(marketCache)
        .where(inArray(marketCache.key, cacheKeys));

      for (const entry of cachedEntries) {
        const symbol = entry.key.replace("STOCK_", "");
        cachedPrices.set(symbol, {
          data: entry.data as any,
          updatedAt: entry.updatedAt,
        });
      }
    } catch (cacheError) {
      console.error("Failed to fetch cached prices:", cacheError);
    }

    // 4. Fetch all prices in a single batch call for efficiency
    const result = await getAllStockPrices();
    const allPrices = result.data?.reqDetailTrades || [];
    const priceMap = new Map<string, StockTrade>(
      allPrices.map((p) => [p.symbol, p]),
    );

    // 5. Process each symbol - use batch data or fall back to cache
    const cacheUpdates: Promise<void>[] = [];

    const priceResults = symbols.map((symbol) => {
      const info = priceMap.get(symbol);
      const hasValidPrice = info?.price != null;

      // If API returned valid price, conditionally queue cache update
      if (hasValidPrice) {
        const priceData = {
          price: {
            price: info.price,
            change: info.change || 0,
            changePercentage: info.changePercentage || 0,
            qty: info.qty || 0,
            trades: info.trades || 0,
            symbol: info.symbol,
            name: info.name,
          },
        };

        // WRITE-LESS STRATEGY: Only update cache if it's stale (> 5 minutes old) or doesn't exist
        const existingCache = cachedPrices.get(symbol);
        const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
        const isCacheStale =
          !existingCache ||
          Date.now() - existingCache.updatedAt.getTime() > CACHE_TTL_MS;

        if (isCacheStale) {
          cacheUpdates.push(
            db
              .insert(marketCache)
              .values({
                key: `STOCK_${symbol}`,
                data: priceData,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: marketCache.key,
                set: {
                  data: priceData,
                  updatedAt: new Date(),
                },
              })
              .then(() => {})
              .catch((e: unknown) =>
                console.error(`Failed to cache ${symbol}:`, e),
              ),
          );
        }

        return {
          symbol,
          price: info.price,
          change: info.change ?? 0,
          percentChange: info.changePercentage ?? 0,
          fromCache: false,
        };
      }

      // API returned null - try cache fallback
      const cached = cachedPrices.get(symbol);
      if (cached?.data?.price) {
        const cachedPrice = cached.data.price;
        return {
          symbol,
          price: cachedPrice.price ?? null,
          change: cachedPrice.change ?? 0,
          percentChange: cachedPrice.changePercentage ?? 0,
          fromCache: true,
          cachedAt: cached.updatedAt.toISOString(),
        };
      }

      // No API data and no cache
      return {
        symbol,
        price: null,
        change: null,
        percentChange: null,
        fromCache: false,
      };
    });

    // Await all cache updates to ensure they complete in serverless environment
    await Promise.all(cacheUpdates);

    // 5. Build price map and track cache usage
    const prices: Record<string, PriceData> = {};
    let hasAnyCachedPrice = false;
    let oldestCacheTime: Date | null = null;

    for (const result of priceResults) {
      if (result.price !== null) {
        prices[result.symbol] = {
          price: result.price,
          change: result.change ?? 0,
          percentChange: result.percentChange ?? 0,
        };

        if (result.fromCache) {
          hasAnyCachedPrice = true;
          prices[result.symbol].fromCache = true;
          prices[result.symbol].cachedAt = result.cachedAt;

          if (result.cachedAt) {
            const cacheDate = new Date(result.cachedAt);
            if (!oldestCacheTime || cacheDate < oldestCacheTime) {
              oldestCacheTime = cacheDate;
            }
          }
        }
      }
    }

    return NextResponse.json({
      data: {
        prices,
        fetchedAt: new Date().toISOString(),
        symbolCount: symbols.length,
        fromCache: hasAnyCachedPrice,
        cachedAt: oldestCacheTime?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching holding prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch holding prices" },
      { status: 500 },
    );
  }
}
