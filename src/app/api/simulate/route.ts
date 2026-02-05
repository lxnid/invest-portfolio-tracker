import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, transactions, tradingRules, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { simulateTransaction } from "@/lib/simulation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stockId, symbol, type, quantity, price, fees } = body;

    if (!symbol || !type || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Fetch necessary data for simulation (User Scoped)
    const [currentHoldings, currentTransactions, rules, appSettings] =
      await Promise.all([
        db.select().from(holdings).where(eq(holdings.userId, session.userId)),
        db
          .select()
          .from(transactions)
          .where(eq(transactions.userId, session.userId)),
        db
          .select()
          .from(tradingRules)
          .where(eq(tradingRules.userId, session.userId)),
        db
          .select()
          .from(settings)
          .where(eq(settings.userId, session.userId))
          .limit(1),
      ]);

    // Enrich holdings (simplification: we don't enrich with live price here to keep simulation fast/stateless essentially,
    // or we assume client passed relevant context?
    // Actually `simulateTransaction` relies on `currentValue`.
    // We should ideally fetch current prices. For now, let's use the provided price for the target stock
    // and assume stored avg prices for others or just use totalInvested as proxy for others if live integration is too heavy.)

    // Better approach: We'll do a basic simulation.
    // For the target stock, we use the proposed price as current price.
    // For others, we'll assume price = avgBuyPrice (conservative) or just use totalInvested.
    // The rule engine uses `currentValue` if available, or fallback.

    const enrichedHoldings = currentHoldings.map((h: any) => ({
      ...h,
      // If it's the stock we are trading, use the simulated price?
      // No, currentHoldings is the starting state.
      // We let the simulator update the specific holding.
      // But for portfolio total calculation, we need values.
      // Let's assume price = avgBuyPrice for others for speed,
      // or we could fetch live prices but that might be slow.
      // User requested "test out transactions".
      // Let's rely on totalInvested for others for now.
    }));

    const settingsObj = appSettings[0] || {
      id: 0,
      capital: "0",
      updatedAt: new Date(),
    };

    const result = simulateTransaction(
      enrichedHoldings as any[], // cast to match helper type which expects enriched fields
      currentTransactions as any[],
      rules as any[],
      settingsObj as any,
      {
        stockId,
        symbol,
        type,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        fees: parseFloat(fees || "0"),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error simulating transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
