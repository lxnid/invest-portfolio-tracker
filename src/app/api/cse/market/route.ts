import { NextResponse, NextRequest } from "next/server";
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

const CACHE_KEY = "MARKET_OVERVIEW";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if refresh is requested
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "true";

    // First, always check cache
    let cachedData = null;
    let cachedAt: Date | null = null;
    try {
      const cachedEntry = await db
        .select()
        .from(marketCache)
        .where(eq(marketCache.key, CACHE_KEY))
        .limit(1);

      if (cachedEntry.length > 0) {
        cachedData = cachedEntry[0].data;
        cachedAt = cachedEntry[0].updatedAt;
      }
    } catch (cacheError) {
      console.error("Failed to fetch from market cache:", cacheError);
    }

    // CACHE-FIRST STRATEGY:
    // If we have cached data and not forcing refresh, return it immediately
    // This makes the page load instantly
    if (cachedData && !forceRefresh) {
      console.log("Serving market data from cache (cache-first strategy)");
      return NextResponse.json({
        data: cachedData,
        errors: { fromCache: true, cachedAt: cachedAt?.toISOString() },
      });
    }

    // Only fetch from API if:
    // 1. No cache exists, OR
    // 2. Refresh was explicitly requested
    console.log(
      forceRefresh ? "Force refresh requested" : "No cache, fetching from API",
    );

    try {
      const [marketStatus, aspi, sp20, stockPrices] = await Promise.all([
        getMarketStatus(),
        getASPI(),
        getSP20(),
        getAllStockPrices(),
      ]);

      const isDataValid =
        marketStatus.data &&
        marketStatus.data.status &&
        aspi.data &&
        stockPrices.data?.reqDetailTrades &&
        stockPrices.data.reqDetailTrades.length > 0;

      // Deduplicate stocks by symbol
      const stockMap = new Map();
      if (stockPrices.data?.reqDetailTrades) {
        for (const trade of stockPrices.data.reqDetailTrades) {
          const cleanSymbol = trade.symbol?.trim().toUpperCase();
          if (cleanSymbol && !stockMap.has(cleanSymbol)) {
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

      // Update cache if data is valid
      if (isDataValid) {
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
          console.log("Market cache updated successfully");
        } catch (cacheError) {
          console.error("Failed to update market cache:", cacheError);
        }

        return NextResponse.json({
          data: responseData,
          errors: responseErrors,
        });
      }

      // API returned invalid data - return cached if available
      if (cachedData) {
        console.log("API returned incomplete data - serving cached data");
        return NextResponse.json({
          data: cachedData,
          errors: { ...responseErrors, fromCache: true },
        });
      }

      // No valid data and no cache
      return NextResponse.json({
        data: responseData,
        errors: responseErrors,
      });
    } catch (apiError) {
      console.error("API fetch failed:", apiError);

      // Return cache on API error
      if (cachedData) {
        return NextResponse.json({
          data: cachedData,
          errors: { fromCache: true, reason: "API error" },
        });
      }

      throw apiError;
    }
  } catch (error) {
    console.error("Error in market route:", error);
    return NextResponse.json(
      { error: "Failed to fetch CSE market data" },
      { status: 500 },
    );
  }
}
