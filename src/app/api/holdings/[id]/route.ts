import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single holding
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const holdingId = parseInt(id);

    const [holding] = await db
      .select({
        id: holdings.id,
        quantity: holdings.quantity,
        avgBuyPrice: holdings.avgBuyPrice,
        totalInvested: holdings.totalInvested,
        updatedAt: holdings.updatedAt,
        stock: {
          id: stocks.id,
          symbol: stocks.symbol,
          name: stocks.name,
          sector: stocks.sector,
        },
      })
      .from(holdings)
      .innerJoin(stocks, eq(holdings.stockId, stocks.id))
      .where(eq(holdings.id, holdingId));

    if (!holding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    return NextResponse.json({ data: holding });
  } catch (error) {
    console.error("Error fetching holding:", error);
    return NextResponse.json(
      { error: "Failed to fetch holding" },
      { status: 500 },
    );
  }
}

// PUT - Update holding
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const holdingId = parseInt(id);
    const body = await request.json();
    const { quantity, avgBuyPrice } = body;

    const totalInvested = quantity * parseFloat(avgBuyPrice);

    const [updated] = await db
      .update(holdings)
      .set({
        quantity,
        avgBuyPrice: avgBuyPrice.toString(),
        totalInvested: totalInvested.toString(),
        updatedAt: new Date(),
      })
      .where(eq(holdings.id, holdingId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating holding:", error);
    return NextResponse.json(
      { error: "Failed to update holding" },
      { status: 500 },
    );
  }
}

// DELETE - Remove holding
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const holdingId = parseInt(id);

    const [deleted] = await db
      .delete(holdings)
      .where(eq(holdings.id, holdingId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Holding deleted successfully" });
  } catch (error) {
    console.error("Error deleting holding:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 },
    );
  }
}
