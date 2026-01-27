import { NextResponse } from "next/server";
import db from "@/db";
import { savingsEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // GUEST MODE: Return mock success
    if (session.role === "guest") {
      const mockUpdatedEntry = {
        id: parseInt(id),
        userId: session.userId,
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
        createdAt: new Date(), // Mock creation date
      };
      return NextResponse.json(mockUpdatedEntry);
    }

    // ADMIN MODE: Update real DB
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
          eq(savingsEntries.userId, session.userId),
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
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // GUEST MODE: Return mock success
    if (session.role === "guest") {
      return NextResponse.json({ success: true });
    }

    const { id } = await params;

    // ADMIN MODE: Delete from real DB
    const deletedEntry = await db
      .delete(savingsEntries)
      .where(
        and(
          eq(savingsEntries.id, parseInt(id)),
          eq(savingsEntries.userId, session.userId),
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
