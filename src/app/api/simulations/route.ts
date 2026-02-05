import { NextResponse } from "next/server";
import { db } from "@/db";
import { savedSimulations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        userId: session.userId,
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db
      .select()
      .from(savedSimulations)
      .where(eq(savedSimulations.userId, session.userId))
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
