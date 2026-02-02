import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  stocks,
  holdings,
  transactions as transactionsTable,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getCompanyInfo, getMarketStatus } from "@/lib/cse-api";

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

// GET stock details, user position, and history
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;

  try {
    // 1. Get stock from database
    let [dbStock] = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol))
      .limit(1);

    // 2. Fetch external market data
    // Use getCompanyInfo for both metadata and price (trusted source)
    const [infoRes, statusRes] = await Promise.all([
      getCompanyInfo(symbol),
      getMarketStatus(),
    ]);

    const externalInfo = infoRes.data?.reqSymbolInfo;

    // If stock not in DB but exists in API, create/update it
    if (!dbStock && externalInfo) {
      const [newStock] = await db
        .insert(stocks)
        .values({
          symbol: externalInfo.symbol,
          name: externalInfo.name || symbol,
          sector: externalInfo.sector,
          // Use a default logo or fetch if available
        })
        .onConflictDoUpdate({
          target: stocks.symbol,
          set: {
            name: externalInfo.name || symbol,
            sector: externalInfo.sector,
            updatedAt: new Date(),
          },
        })
        .returning();
      dbStock = newStock;
    }

    if (!dbStock && !externalInfo) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Determine market status
    let marketIsOpen = statusRes.data?.status?.toLowerCase() === "open";

    // Fallback: If API says closed (or fails) but it's clearly trading hours (Mon-Fri, 09:30-14:30 IST/SLST), assume open.
    if (!marketIsOpen) {
      try {
        const now = new Date();
        const colomboTime = new Date(
          now.toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
        );
        const day = colomboTime.getDay(); // 0 is Sunday, 6 is Saturday
        const hour = colomboTime.getHours();
        const minute = colomboTime.getMinutes();
        const timeInMinutes = hour * 60 + minute;

        // Mon-Fri
        const isWeekday = day >= 1 && day <= 5;
        // 09:30 to 14:30
        const isTradingHours =
          timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 14 * 60 + 30;

        if (isWeekday && isTradingHours) {
          marketIsOpen = true;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Use getCompanyInfo price as the single source of truth
    const currentPrice = externalInfo?.lastTradedPrice ?? 0;

    const marketData = {
      price: currentPrice,
      change: externalInfo?.change || 0,
      percentChange: externalInfo?.changePercentage || 0,
      volume: externalInfo?.tdyShareVolume || 0,
      trades: externalInfo?.tdyTradeVolume || 0,
      fiftyTwoWeekHigh: externalInfo?.p12HiPrice || 0,
      fiftyTwoWeekLow: externalInfo?.p12LowPrice || 0,
      isOpen: marketIsOpen,
    };

    // 3. Get user position (holdings) - only if we have a dbStock (which we should now)
    const [userHolding] = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.stockId, dbStock.id),
          eq(holdings.userId, session.userId),
        ),
      )
      .limit(1);

    let position = null;
    if (userHolding) {
      const currentValue = userHolding.quantity * marketData.price;
      const totalInvested = parseFloat(userHolding.totalInvested);
      const unrealizedPL = currentValue - totalInvested;
      const unrealizedPLPercent =
        totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;

      position = {
        ...userHolding,
        currentValue,
        unrealizedPL,
        unrealizedPLPercent,
      };
    }

    // 4. Get transaction history
    const history = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.stockId, dbStock.id),
          eq(transactionsTable.userId, session.userId),
        ),
      )
      .orderBy(desc(transactionsTable.date));

    const totalDividends = history
      .filter((tx) => tx.type === "DIVIDEND")
      .reduce((sum, tx) => sum + parseFloat(tx.price) * tx.quantity, 0);

    const buyCount = history.filter((tx) => tx.type === "BUY").length;
    const sellCount = history.filter((tx) => tx.type === "SELL").length;

    return NextResponse.json({
      data: {
        symbol: dbStock.symbol,
        name: dbStock.name,
        sector: dbStock.sector,
        logoPath: dbStock.logoPath,

        company: infoRes.data || null,
        marketData,
        position,
        performance: {
          totalDividends,
          buyCount,
          sellCount,
        },
        transactions: history.map((tx) => ({
          ...tx,
          totalAmount: (parseFloat(tx.price) * tx.quantity).toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Error in stock details API:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock details" },
      { status: 500 },
    );
  }
}

// PATCH to update stock sector
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await params;

  try {
    const body = await request.json();
    const { sector } = body;

    if (sector === undefined) {
      return NextResponse.json(
        { error: "Sector is required" },
        { status: 400 },
      );
    }

    const result = await db
      .update(stocks)
      .set({
        sector: sector || null,
        updatedAt: new Date(),
      })
      .where(eq(stocks.symbol, symbol))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Failed to update stock", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 },
    );
  }
}
