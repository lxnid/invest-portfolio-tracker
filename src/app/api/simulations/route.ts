import { NextResponse } from "next/server";
import { db } from "@/db";
import { savedSimulations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, configuration } = body;

    if (!name || !configuration) {
      return NextResponse.json(
        { error: "Name and configuration are required" },
        { status: 400 },
      );
    }

    const [saved] = await db
      .insert(savedSimulations)
      .values({
        name,
        configuration,
        userId: "admin-user",
      })
      .returning();

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error saving simulation:", error);
    return NextResponse.json(
      { error: "Failed to save simulation" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const list = await db
      .select()
      .from(savedSimulations)
      .orderBy(desc(savedSimulations.createdAt));

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching simulations:", error);
    return NextResponse.json(
      { error: "Failed to fetch simulations" },
      { status: 500 },
    );
  }
}
