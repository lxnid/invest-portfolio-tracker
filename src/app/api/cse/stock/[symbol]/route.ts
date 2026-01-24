import { NextResponse } from "next/server";
import { getStockPrice, getCompanyInfo } from "@/lib/cse-api";

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

// GET stock details by symbol
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { symbol } = await params;

    const [priceData, companyInfo] = await Promise.all([
      getStockPrice(symbol),
      getCompanyInfo(symbol),
    ]);

    return NextResponse.json({
      data: {
        price: priceData.data?.reqDetailTrades?.[0] || null,
        company: companyInfo.data,
      },
      errors: {
        price: priceData.error,
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
