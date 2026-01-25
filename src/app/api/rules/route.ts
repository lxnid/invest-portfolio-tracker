import { NextResponse } from "next/server";
import { db } from "@/db";
import { tradingRules } from "@/db/schema";

import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET all rules
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db
      .select()
      .from(tradingRules)
      .where(eq(tradingRules.userId, session.userId))
      .orderBy(desc(tradingRules.createdAt));

    return NextResponse.json({ data: rules });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 },
    );
  }
}

// POST - Create new rule
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, ruleType, threshold, isActive } = body;

    const [newRule] = await db
      .insert(tradingRules)
      .values({
        userId: session.userId,
        name,
        description,
        ruleType,
        threshold: threshold.toString(),
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ data: newRule }, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 },
    );
  }
}
