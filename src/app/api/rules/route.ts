import { NextResponse } from "next/server";
import { db } from "@/db";
import { tradingRules } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET all trading rules
export async function GET() {
  try {
    const rules = await db.select().from(tradingRules);
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
    const body = await request.json();
    const { name, description, ruleType, conditions } = body;

    const [newRule] = await db
      .insert(tradingRules)
      .values({
        name,
        description,
        ruleType,
        conditions,
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
