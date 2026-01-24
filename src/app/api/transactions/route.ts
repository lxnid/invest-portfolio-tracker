import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, stocks, holdings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET all transactions
export async function GET(request: Request) {
  try {
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
        totalAmount: transactions.totalAmount,
        notes: transactions.notes,
        executedAt: transactions.executedAt,
        createdAt: transactions.createdAt,
        stock: {
          id: stocks.id,
          symbol: stocks.symbol,
          name: stocks.name,
        },
      })
      .from(transactions)
      .innerJoin(stocks, eq(transactions.stockId, stocks.id))
      .orderBy(desc(transactions.executedAt))
      .limit(limit);

    const data = await query;

    // Filter by type if specified
    const filteredData = type ? data.filter((t) => t.type === type) : data;

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
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
      executedAt,
    } = body;

    // Find or create stock
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

    // Calculate total amount
    const feesAmount = parseFloat(fees || "0");
    let totalAmount: number;
    if (type === "BUY") {
      totalAmount = quantity * parseFloat(price) + feesAmount;
    } else if (type === "SELL") {
      totalAmount = quantity * parseFloat(price) - feesAmount;
    } else {
      // DIVIDEND
      totalAmount = quantity * parseFloat(price);
    }

    // Create transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        stockId: stock.id,
        type,
        quantity,
        price: price.toString(),
        fees: feesAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes,
        executedAt: new Date(executedAt),
      })
      .returning();

    // Update holdings based on transaction type
    const [existingHolding] = await db
      .select()
      .from(holdings)
      .where(eq(holdings.stockId, stock.id));

    if (type === "BUY") {
      if (existingHolding) {
        // Update existing holding
        const newQuantity = existingHolding.quantity + quantity;
        const oldTotal = parseFloat(existingHolding.totalInvested);
        const newTotal = oldTotal + quantity * parseFloat(price);
        const newAvgPrice = newTotal / newQuantity;

        await db
          .update(holdings)
          .set({
            quantity: newQuantity,
            avgBuyPrice: newAvgPrice.toFixed(2),
            totalInvested: newTotal.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(holdings.id, existingHolding.id));
      } else {
        // Create new holding
        const totalInvested = quantity * parseFloat(price);
        await db.insert(holdings).values({
          stockId: stock.id,
          quantity,
          avgBuyPrice: price.toString(),
          totalInvested: totalInvested.toString(),
        });
      }
    } else if (type === "SELL" && existingHolding) {
      const newQuantity = existingHolding.quantity - quantity;
      if (newQuantity <= 0) {
        // Remove holding completely
        await db.delete(holdings).where(eq(holdings.id, existingHolding.id));
      } else {
        // Reduce quantity, keep avg price
        const newTotal = newQuantity * parseFloat(existingHolding.avgBuyPrice);
        await db
          .update(holdings)
          .set({
            quantity: newQuantity,
            totalInvested: newTotal.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(holdings.id, existingHolding.id));
      }
    }

    return NextResponse.json({ data: newTransaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
