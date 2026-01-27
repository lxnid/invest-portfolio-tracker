import { NextResponse } from "next/server";
import db from "@/db";
import { savingsEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // In a real app, we would get the userId from the session
    const userId = "admin-user";

    const entries = await db
      .select()
      .from(savingsEntries)
      .where(eq(savingsEntries.userId, userId));

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching savings entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch savings entries" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const userId = "admin-user"; // Mock user ID

    // Validate required fields
    if (
      !data.name ||
      !data.amount ||
      !data.type ||
      data.interestRate === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newEntry = await db
      .insert(savingsEntries)
      .values({
        userId,
        name: data.name,
        bankName: data.bankName || null,
        type: data.type,
        amount: data.amount,
        interestRate: data.interestRate,
        currency: data.currency || "LKR",
        startDate: data.startDate ? new Date(data.startDate) : null,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(newEntry[0]);
  } catch (error) {
    console.error("Error creating savings entry:", error);
    return NextResponse.json(
      { error: "Failed to create savings entry" },
      { status: 500 },
    );
  }
}
