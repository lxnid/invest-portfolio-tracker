import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, stocks } from "@/db/schema";
import { PortfolioService } from "@/lib/portfolio-service";
import { eq, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET all transactions
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db
      .select({
        id: transactions.id,
        type: transactions.type,
        quantity: transactions.quantity,
        price: transactions.price,
        fees: transactions.fees,
        date: transactions.date,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        stock: {
          id: stocks.id,
          symbol: stocks.symbol,
          name: stocks.name,
        },
      })
      .from(transactions)
      .innerJoin(stocks, eq(transactions.stockId, stocks.id))
      .where(eq(transactions.userId, session.userId))
      .orderBy(desc(transactions.date))
      .limit(limit);

    const data = await query;

    // Compute totalAmount
    const dataWithTotal = data.map((t) => {
      const gross = Number(t.quantity) * Number(t.price);
      const fees = Number(t.fees || 0);
      let totalAmount = gross;
      if (t.type === "BUY") {
        totalAmount = gross + fees;
      } else if (t.type === "SELL") {
        totalAmount = gross - fees; // Net proceeds
      } else {
        totalAmount = gross - fees; // Net dividend
      }
      return { ...t, totalAmount: totalAmount.toString() };
    });

    // Filter by type if specified
    const filteredData = type
      ? dataWithTotal.filter((t) => t.type === type)
      : dataWithTotal;

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      name,
      sector,
      type,
      quantity,
      price,
      fees,
      notes,
      executedAt, // Frontend sends executedAt, we map to date
    } = body;

    // Find or create stock (Stocks are GLOBAL/SHARED)
    let [stock] = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol));

    if (!stock) {
      const [newStock] = await db
        .insert(stocks)
        .values({ symbol, name, sector })
        .returning();
      stock = newStock;
    }

    // Use PortfolioService to handle global sync logic
    const newTransaction = await PortfolioService.processTransaction(
      session.userId,
      {
        stockId: stock.id,
        type: type as "BUY" | "SELL" | "DIVIDEND",
        quantity,
        price: price.toString(),
        fees: fees ? fees.toString() : "0",
        date: executedAt ? new Date(executedAt) : new Date(),
        notes,
      },
    );

    return NextResponse.json({ data: newTransaction });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
        details: error instanceof Error ? error.stack : JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}
