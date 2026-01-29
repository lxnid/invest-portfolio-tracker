import { NextResponse } from "next/server";
import {
  getMarketStatus,
  getASPI,
  getSP20,
  getAllStockPrices,
} from "@/lib/cse-api";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { marketCache } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET market overview data from CSE
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all data in parallel
    const [marketStatus, aspi, sp20, stockPrices] = await Promise.all([
      getMarketStatus(),
      getASPI(),
      getSP20(),
      getAllStockPrices(),
    ]);

    // Check if we received valid data
    const isDataValid =
      marketStatus.data &&
      marketStatus.data.status &&
      aspi.data &&
      stockPrices.data?.reqDetailTrades;

    // Deduplicate stocks by symbol
    const stockMap = new Map();
    if (stockPrices.data?.reqDetailTrades) {
      for (const trade of stockPrices.data.reqDetailTrades) {
        const cleanSymbol = trade.symbol?.trim().toUpperCase();
        if (cleanSymbol && !stockMap.has(cleanSymbol)) {
          // Normalize data structure
          // detailedTrades endpoint uses 'qty' for volume
          stockMap.set(cleanSymbol, {
            symbol: cleanSymbol,
            name: trade.name,
            price: trade.price,
            change: trade.change || 0,
            percentChange: trade.changePercentage || 0,
            volume: trade.qty || 0,
            trades: trade.trades || 0,
            securityId: trade.securityId,
          });
        }
      }
    }

    const responseData = {
      marketStatus: marketStatus.data
        ? {
            status: marketStatus.data.status,
            isOpen: marketStatus.data.status === "Regular Trading",
          }
        : null,
      aspi: aspi.data
        ? {
            index: aspi.data.value,
            change: aspi.data.change,
            percentChange: aspi.data.changePercentage || 0,
          }
        : null,
      sp20: sp20.data
        ? {
            index: sp20.data.value,
            change: sp20.data.change,
            percentChange: sp20.data.changePercentage || 0,
          }
        : null,
      allStocks: Array.from(stockMap.values()),
    };

    const responseErrors = {
      marketStatus: marketStatus.error,
      aspi: aspi.error,
      sp20: sp20.error,
      stockPrices: stockPrices.error,
    };

    // CACHING LOGIC
    const CACHE_KEY = "MARKET_OVERVIEW";

    if (isDataValid) {
      // If data is valid, update the cache
      try {
        await db
          .insert(marketCache)
          .values({
            key: CACHE_KEY,
            data: responseData,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: marketCache.key,
            set: {
              data: responseData,
              updatedAt: new Date(),
            },
          });
      } catch (cacheError) {
        console.error("Failed to update market cache:", cacheError);
      }
    } else {
      // If data is invalid (e.g., market closed/API error), try to fetch from cache
      console.warn("CSE API returned incomplete data, checking cache...");
      try {
        const cachedEntry = await db
          .select()
          .from(marketCache)
          .where(eq(marketCache.key, CACHE_KEY))
          .limit(1);

        if (cachedEntry.length > 0) {
          console.log("Serving market data from cache");
          return NextResponse.json({
            data: cachedEntry[0].data,
            errors: isDataValid
              ? responseErrors
              : { ...responseErrors, fromCache: true },
          });
        }
      } catch (cacheError) {
        console.error("Failed to fetch from market cache:", cacheError);
      }
    }

    return NextResponse.json({
      data: responseData,
      errors: responseErrors,
    });
  } catch (error) {
    console.error("Error fetching CSE data:", error);

    // Fallback to cache on general error
    try {
      const cachedEntry = await db
        .select()
        .from(marketCache)
        .where(eq(marketCache.key, "MARKET_OVERVIEW"))
        .limit(1);

      if (cachedEntry.length > 0) {
        console.log("Serving market data from cache (on error)");
        return NextResponse.json({
          data: cachedEntry[0].data,
          errors: { error: "Failed to fetch CSE market data", fromCache: true },
        });
      }
    } catch {}

    return NextResponse.json(
      { error: "Failed to fetch CSE market data" },
      { status: 500 },
    );
  }
}
