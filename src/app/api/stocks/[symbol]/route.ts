import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks, transactions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getStockPrice, getCompanyInfo, getMarketStatus } from "@/lib/cse-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    // 1. Fetch Data in Parallel
    const [dbStockRes, csePriceRes, cseInfoRes, marketStatusRes] =
      await Promise.all([
        db.select().from(stocks).where(eq(stocks.symbol, upperSymbol)),
        getStockPrice(upperSymbol),
        getCompanyInfo(upperSymbol),
        getMarketStatus(),
      ]);

    const dbStock = dbStockRes[0];
    const csePrice = csePriceRes.data?.reqDetailTrades?.[0];
    const cseInfo = cseInfoRes.data;

    if (!dbStock && !csePrice) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // 2. Fetch Holdings & Transactions if stock exists in DB
    let holding = null;
    let stockTransactions: any[] = [];

    if (dbStock) {
      const [holdingRes, txRes] = await Promise.all([
        db.select().from(holdings).where(eq(holdings.stockId, dbStock.id)),
        db
          .select()
          .from(transactions)
          .where(eq(transactions.stockId, dbStock.id))
          .orderBy(desc(transactions.date)),
      ]);

      holding = holdingRes[0] || null;
      stockTransactions = txRes;
    }

    // 3. Calculate Performance Metrics
    let realizedPL = 0;
    let totalDividends = 0;
    let buyCount = 0;
    let sellCount = 0;

    stockTransactions.forEach((tx) => {
      const totalAmt =
        parseFloat(tx.quantity.toString()) * parseFloat(tx.price.toString());

      if (tx.type === "SELL") {
        sellCount++;
        // Rough realized P/L approx logic:
        // Realized = (Sell Price - Avg Buy Price at that time) * Qty
        // But for simple aggregation without reconstructing history state:
        // We can't perfectly calc realized P/L without FIFO/LIFO logic replay.
        // For now, let's just sum partials if we stored them, OR
        // We will just return the transaction history and let UI or a helper compute complex stats.
        // However, we can sum dividends easily.
      } else if (tx.type === "BUY") {
        buyCount++;
      } else if (tx.type === "DIVIDEND") {
        totalDividends += totalAmt;
      }
    });

    // 4. Construct Response
    return NextResponse.json({
      data: {
        symbol: upperSymbol,
        name: cseInfo?.reqSymbolInfo?.name || dbStock?.name || csePrice?.name,
        sector: cseInfo?.reqSymbolInfo?.sector || dbStock?.sector,
        logoPath: cseInfo?.reqLogo?.path
          ? `https://www.cse.lk/${cseInfo.reqLogo.path}`
          : null,

        marketData: {
          price:
            csePrice?.price || cseInfo?.reqSymbolInfo?.lastTradedPrice || 0,
          change: csePrice?.change || cseInfo?.reqSymbolInfo?.change || 0,
          percentChange:
            csePrice?.changePercentage ||
            cseInfo?.reqSymbolInfo?.changePercentage ||
            0,
          volume: csePrice?.qty || cseInfo?.reqSymbolInfo?.tdyShareVolume || 0,
          trades:
            csePrice?.trades || cseInfo?.reqSymbolInfo?.tdyTradeVolume || 0,
          isOpen: marketStatusRes.data?.status === "Open",
        },

        position: holding
          ? {
              quantity: holding.quantity,
              avgBuyPrice: holding.avgBuyPrice,
              initialBuyPrice: holding.initialBuyPrice,
              lastBuyPrice: holding.lastBuyPrice,
              totalInvested: holding.totalInvested,
              currentValue:
                holding.quantity *
                (csePrice?.price ||
                  cseInfo?.reqSymbolInfo?.lastTradedPrice ||
                  0),
              unrealizedPL:
                holding.quantity *
                  (csePrice?.price ||
                    cseInfo?.reqSymbolInfo?.lastTradedPrice ||
                    0) -
                parseFloat(holding.totalInvested),
              unrealizedPLPercent:
                parseFloat(holding.totalInvested) > 0
                  ? ((holding.quantity *
                      (csePrice?.price ||
                        cseInfo?.reqSymbolInfo?.lastTradedPrice ||
                        0) -
                      parseFloat(holding.totalInvested)) /
                      parseFloat(holding.totalInvested)) *
                    100
                  : 0,
            }
          : null,

        performance: {
          totalDividends,
          buyCount,
          sellCount,
          // Realized P/L would need a dedicated service to calculate accurately
        },

        transactions: stockTransactions.map((tx) => ({
          ...tx,
          totalAmount: (
            parseFloat(tx.quantity.toString()) * parseFloat(tx.price.toString())
          ).toString(), // Simple gross amount
        })),
      },
    });
  } catch (error) {
    console.error("Error serving stock detail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
