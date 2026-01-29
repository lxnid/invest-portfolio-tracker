import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/cse-api";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { marketCache } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

// GET stock details by symbol
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const symbol = resolvedParams.symbol.toUpperCase();

    const [companyInfo] = await Promise.all([getCompanyInfo(symbol)]);

    const info = companyInfo.data?.reqSymbolInfo;
    const isDataValid =
      !!info && companyInfo.data?.reqSymbolInfo?.symbol === symbol;

    // Construct price object from company info
    const priceData = info
      ? {
          price: info.lastTradedPrice || 0,
          change: info.change || 0,
          changePercentage: info.changePercentage || 0,
          qty: info.tdyShareVolume || 0,
          trades: info.tdyTradeVolume || 0,
          symbol: info.symbol,
          name: info.name,
        }
      : null;

    const responseData = {
      price: priceData,
      company: companyInfo.data,
    };

    const responseErrors = {
      price: null,
      company: companyInfo.error,
    };

    const CACHE_KEY = `STOCK_${symbol}`;

    if (isDataValid) {
      // Update cache
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
      } catch (e) {
        console.error(`Failed to cache stock data for ${symbol}:`, e);
      }
    } else {
      // Try fetch from cache
      console.warn(
        `CSE API returned incomplete data for ${symbol}, checking cache...`,
      );
      try {
        const cached = await db
          .select()
          .from(marketCache)
          .where(eq(marketCache.key, CACHE_KEY))
          .limit(1);
        if (cached.length > 0) {
          console.log(`Serving stock data for ${symbol} from cache`);
          return NextResponse.json({
            data: cached[0].data,
            errors: isDataValid
              ? responseErrors
              : { ...responseErrors, fromCache: true },
          });
        }
      } catch (e) {
        console.error(`Failed to fetch from cache for ${symbol}:`, e);
      }
    }

    return NextResponse.json({
      data: responseData,
      errors: responseErrors,
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);

    // Fallback to cache
    try {
      const resolvedParams = await params; // Re-await just in case, though usually safe
      const symbol = resolvedParams.symbol.toUpperCase();
      const cached = await db
        .select()
        .from(marketCache)
        .where(eq(marketCache.key, `STOCK_${symbol}`))
        .limit(1);
      if (cached.length > 0) {
        return NextResponse.json({
          data: cached[0].data,
          errors: { error: "Failed to fetch stock data", fromCache: true },
        });
      }
    } catch {}

    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 },
    );
  }
}
