import { NextResponse, NextRequest } from "next/server";
import { getMarketStatus, getASPI, getSP20 } from "@/lib/cse-api";
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

    // First, always check cache for fallback purposes
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

    // API-FIRST STRATEGY:
    // Always fetch fresh data from API for accuracy.
    // Cache is only used as fallback when API fails.
    console.log(
      "Fetching fresh market data from API (accuracy-first strategy)",
    );

    try {
      const [marketStatus, aspi, sp20] = await Promise.all([
        getMarketStatus(),
        getASPI(),
        getSP20(),
      ]);

      const isDataValid =
        marketStatus.data && marketStatus.data.status && aspi.data;

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
      };

      const responseErrors = {
        marketStatus: marketStatus.error,
        aspi: aspi.error,
        sp20: sp20.error,
      };

      // WRITE-LESS STRATEGY: Only update cache if stale (> 5 minutes) or doesn't exist
      if (isDataValid) {
        const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
        const isCacheStale =
          !cachedAt || Date.now() - cachedAt.getTime() > CACHE_TTL_MS;

        if (isCacheStale) {
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
            console.log("Market cache updated (was stale)");
          } catch (cacheError) {
            console.error("Failed to update market cache:", cacheError);
          }
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
