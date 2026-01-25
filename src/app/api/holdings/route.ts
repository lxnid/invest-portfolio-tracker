import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { z } from "zod";

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

import { PortfolioService } from "@/lib/portfolio-service";

// ... (GET handler remains same)

// POST - Add new holding
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check demo limits
    const { checkDemoHoldingsLimit } = await import("@/lib/demo-limits");
    const limit = await checkDemoHoldingsLimit(session.userId);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Demo limit reached: Max ${limit.max} holdings allowed.` },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Zod Validation
    const schema = z.object({
      symbol: z.string().min(1),
      name: z.string().optional(), // PortfolioService will handle stock creation if needed, but usually we just need symbol
      sector: z.string().optional(),
      quantity: z.coerce.number().positive(), // Allow numeric strings
      avgBuyPrice: z.coerce
        .number()
        .positive()
        .transform((val) => String(val)),
      date: z.string().optional(), // Allow optional date
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error },
        { status: 400 },
      );
    }

    const { symbol, quantity, avgBuyPrice, date } = parsed.data;

    // Use PortfolioService to create the "Buy" transaction which will update holdings
    // This ensures consistency between Transactions and Holdings

    // First we might need the stockId. PortfolioService expects stockId.
    // So we still need to find/create the stock here to get the ID.
    let stockId: number;

    // Quick check/create stock
    const [existingStock] = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol));

    if (existingStock) {
      stockId = existingStock.id;
    } else {
      const [newStock] = await db
        .insert(stocks)
        .values({
          symbol,
          name: parsed.data.name || symbol, // Fallback name
          sector: parsed.data.sector,
        })
        .returning();
      stockId = newStock.id;
    }

    const result = await PortfolioService.processTransaction(session.userId, {
      stockId,
      type: "BUY",
      quantity,
      price: avgBuyPrice,
      fees: "0",
      date: date ? new Date(date) : new Date(),
      notes: "Manual holding addition",
    });

    return NextResponse.json(
      { data: result, message: "Holding added via transaction" },
      { status: 201 },
    );
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
