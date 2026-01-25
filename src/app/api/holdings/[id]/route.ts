import { NextResponse } from "next/server";
import { db } from "@/db";
import { holdings, stocks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db
      .delete(holdings)
      .where(
        and(eq(holdings.id, parseInt(id)), eq(holdings.userId, session.userId)),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Holding not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting holding:", error);
    return NextResponse.json(
      { error: "Failed to delete holding" },
      { status: 500 },
    );
  }
}
