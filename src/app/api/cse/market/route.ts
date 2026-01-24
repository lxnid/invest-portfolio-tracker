import { NextResponse } from "next/server";
import {
  getMarketStatus,
  getASPI,
  getSP20,
  getAllStockPrices,
} from "@/lib/cse-api";

// GET market overview data from CSE
export async function GET() {
  try {
    // Fetch all data in parallel
    const [marketStatus, aspi, sp20, stockPrices] = await Promise.all([
      getMarketStatus(),
      getASPI(),
      getSP20(),
      getAllStockPrices(),
    ]);

    return NextResponse.json({
      data: {
        marketStatus: marketStatus.data,
        aspi: aspi.data,
        sp20: sp20.data,
        allStocks: stockPrices.data?.reqDetailTrades || [],
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
