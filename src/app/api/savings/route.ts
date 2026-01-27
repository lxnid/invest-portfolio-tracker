import { NextResponse } from "next/server";
import db from "@/db";
import { savingsEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { MOCK_SAVINGS } from "@/lib/demo-data";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // GUEST MODE: Return mock data
    if (session.role === "guest") {
      return NextResponse.json(MOCK_SAVINGS);
    }

    // ADMIN MODE: Return real data
    const entries = await db
      .select()
      .from(savingsEntries)
      .where(eq(savingsEntries.userId, session.userId));

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
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

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

    // GUEST MODE: Return mock success (don't write to DB)
    if (session.role === "guest") {
      const mockEntry = {
        id: Math.floor(Math.random() * 1000) + 100, // Random ID
        userId: session.userId,
        name: data.name,
        bankName: data.bankName || null,
        type: data.type,
        amount: data.amount,
        interestRate: data.interestRate,
        currency: data.currency || "LKR",
        startDate: data.startDate ? new Date(data.startDate) : null,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return NextResponse.json(mockEntry);
    }

    // ADMIN MODE: Write to DB
    const newEntry = await db
      .insert(savingsEntries)
      .values({
        userId: session.userId,
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
