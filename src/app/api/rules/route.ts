import { NextResponse } from "next/server";
import { db } from "@/db";
import { tradingRules } from "@/db/schema";

// GET all trading rules
export async function GET() {
  try {
    const rules = await db.select().from(tradingRules);

    // Transform conditions to extract threshold for frontend
    const transformedRules = rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      threshold: rule.threshold,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
    }));

    return NextResponse.json({ data: transformedRules });
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
    const { name, description, ruleType, threshold, isActive } = body;

    // Store threshold in conditions JSONB
    const [newRule] = await db
      .insert(tradingRules)
      .values({
        name,
        description,
        ruleType,
        threshold: threshold.toString(),
        isActive: isActive ?? true,
      })
      .returning();

    // Transform for frontend
    const transformed = {
      id: newRule.id,
      name: newRule.name,
      description: newRule.description,
      ruleType: newRule.ruleType,
      threshold: threshold.toString(),
      isActive: newRule.isActive,
      createdAt: newRule.createdAt,
    };

    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 },
    );
  }
}
