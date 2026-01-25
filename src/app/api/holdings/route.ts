import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET all holdings with stock info
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const holdingsData = await db
      .select({
        id: holdings.id,
        quantity: holdings.quantity,
        avgBuyPrice: holdings.avgBuyPrice,
        initialBuyPrice: holdings.initialBuyPrice,
        lastBuyPrice: holdings.lastBuyPrice,
        totalInvested: holdings.totalInvested,
        status: holdings.status,
        updatedAt: holdings.updatedAt,
        stock: {
          id: stocks.id,
          symbol: stocks.symbol,
          name: stocks.name,
          sector: stocks.sector,
          logoPath: stocks.logoPath,
        },
      })
      .from(holdings)
      .innerJoin(stocks, eq(holdings.stockId, stocks.id))
      .where(eq(holdings.userId, session.userId));

    return NextResponse.json({ data: holdingsData });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 },
    );
  }
}

// POST - Add new holding
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, name, sector, quantity, avgBuyPrice } = body;

    // First, create or find the stock
    let [stock] = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol));

    if (!stock) {
      const [newStock] = await db
        .insert(stocks)
        .values({
          symbol,
          name,
          sector,
        })
        .returning();
      stock = newStock;
    }

    // Create the holding
    const totalInvested = quantity * parseFloat(avgBuyPrice);
    const [newHolding] = await db
      .insert(holdings)
      .values({
        stockId: stock.id,
        quantity,
        avgBuyPrice: avgBuyPrice.toString(),
        totalInvested: totalInvested.toString(),
        status: "active",
      })
      .returning();

    return NextResponse.json({ data: newHolding }, { status: 201 });
  } catch (error) {
    console.error("Error creating holding:", error);
    return NextResponse.json(
      {
        error: "Failed to create holding",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
