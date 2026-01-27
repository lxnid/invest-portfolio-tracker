import { NextResponse } from "next/server";
import db from "@/db";
import { savingsEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const userId = "admin-user";

    const updatedEntry = await db
      .update(savingsEntries)
      .set({
        name: data.name,
        bankName: data.bankName || null,
        type: data.type,
        amount: data.amount,
        interestRate: data.interestRate,
        currency: data.currency,
        startDate: data.startDate ? new Date(data.startDate) : null,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(savingsEntries.id, parseInt(id)),
          eq(savingsEntries.userId, userId),
        ),
      )
      .returning();

    if (updatedEntry.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEntry[0]);
  } catch (error) {
    console.error("Error updating savings entry:", error);
    return NextResponse.json(
      { error: "Failed to update savings entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = "admin-user";

    const deletedEntry = await db
      .delete(savingsEntries)
      .where(
        and(
          eq(savingsEntries.id, parseInt(id)),
          eq(savingsEntries.userId, userId),
        ),
      )
      .returning();

    if (deletedEntry.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings entry:", error);
    return NextResponse.json(
      { error: "Failed to delete savings entry" },
      { status: 500 },
    );
  }
}
