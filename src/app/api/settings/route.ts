import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, session.userId));

    // If no settings exist, return default
    if (allSettings.length === 0) {
      return NextResponse.json({ capital: 0, updatedAt: new Date() });
    }

    return NextResponse.json(allSettings[0]);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
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

    const body = await request.json();
    const { capital } = body;

    const allSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, session.userId));

    if (allSettings.length === 0) {
      await db.insert(settings).values({
        userId: session.userId,
        capital: capital.toString(),
      });
    } else {
      await db
        .update(settings)
        .set({ capital: capital.toString(), updatedAt: new Date() })
        .where(eq(settings.id, allSettings[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
