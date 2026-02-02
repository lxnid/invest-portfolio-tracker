import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getCompanyInfo } from "@/lib/cse-api";

export const dynamic = "force-dynamic";

// GET prices only for user's holdings - lightweight alternative to /api/cse/market
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
      return NextResponse.json({ data: { prices: {} } });
    }

    // 2. Get unique symbols
    const symbols = [...new Set(userHoldings.map((h) => h.symbol))];

    // 3. Fetch prices for each symbol in parallel
    // Using getCompanyInfo to fetch specific stock data (true lightweight)
    // and matching the data source of the Stock Details page (trusted accuracy)
    const pricePromises = symbols.map(async (symbol) => {
      const result = await getCompanyInfo(symbol);
      const info = result.data?.reqSymbolInfo;
      return {
        symbol,
        price: info?.lastTradedPrice ?? null,
        change: info?.change ?? null,
        percentChange: info?.changePercentage ?? null,
      };
    });

    const priceResults = await Promise.all(pricePromises);

    // 4. Build price map
    const prices: Record<
      string,
      { price: number; change: number; percentChange: number }
    > = {};
    for (const result of priceResults) {
      if (result.price !== null) {
        prices[result.symbol] = {
          price: result.price,
          change: result.change ?? 0,
          percentChange: result.percentChange ?? 0,
        };
      }
    }

    return NextResponse.json({
      data: {
        prices,
        fetchedAt: new Date().toISOString(),
        symbolCount: symbols.length,
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
