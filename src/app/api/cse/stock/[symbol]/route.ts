import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/cse-api";

import { getSession } from "@/lib/auth";

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

    const { symbol } = await params;

    const [companyInfo] = await Promise.all([getCompanyInfo(symbol)]);

    const info = companyInfo.data?.reqSymbolInfo;

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

    return NextResponse.json({
      data: {
        price: priceData,
        company: companyInfo.data,
      },
      errors: {
        price: null,
        company: companyInfo.error,
      },
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 },
    );
  }
}
