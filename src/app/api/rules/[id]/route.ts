import { NextResponse } from "next/server";
import { db } from "@/db";
import { tradingRules } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET single rule
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [rule] = await db
      .select()
      .from(tradingRules)
      .where(eq(tradingRules.id, parseInt(id)));

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const transformed = {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      threshold:
        (rule.conditions as { threshold?: number })?.threshold?.toString() ||
        "0",
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("Error fetching rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule" },
      { status: 500 },
    );
  }
}

// PUT - Update rule
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, ruleType, threshold, isActive } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (ruleType !== undefined) updateData.ruleType = ruleType;
    if (threshold !== undefined) {
      updateData.conditions = {
        type: ruleType,
        threshold: parseFloat(threshold),
      };
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(tradingRules)
      .set(updateData)
      .where(eq(tradingRules.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const transformed = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      ruleType: updated.ruleType,
      threshold:
        (updated.conditions as { threshold?: number })?.threshold?.toString() ||
        "0",
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 },
    );
  }
}

// DELETE rule
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(tradingRules)
      .where(eq(tradingRules.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 },
    );
  }
}
