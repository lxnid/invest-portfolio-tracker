import { NextResponse } from "next/server";
import {
  getMarketStatus,
  getASPI,
  getSP20,
  getAllStockPrices,
} from "@/lib/cse-api";

// GET market overview data from CSE
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch all data in parallel
    const [marketStatus, aspi, sp20, stockPrices] = await Promise.all([
      getMarketStatus(),
      getASPI(),
      getSP20(),
      getAllStockPrices(),
    ]);

    // Deduplicate stocks by symbol
    const stockMap = new Map();
    if (stockPrices.data?.reqDetailTrades) {
      for (const trade of stockPrices.data.reqDetailTrades) {
        const cleanSymbol = trade.symbol?.trim().toUpperCase();
        if (cleanSymbol && !stockMap.has(cleanSymbol)) {
          stockMap.set(cleanSymbol, { ...trade, symbol: cleanSymbol });
        }
      }
    }

    return NextResponse.json({
      data: {
        marketStatus: marketStatus.data,
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
      },
      errors: {
        marketStatus: marketStatus.error,
        aspi: aspi.error,
        sp20: sp20.error,
        stockPrices: stockPrices.error,
      },
    });
  } catch (error) {
    console.error("Error fetching CSE data:", error);
    return NextResponse.json(
      { error: "Failed to fetch CSE market data" },
      { status: 500 },
    );
  }
}
