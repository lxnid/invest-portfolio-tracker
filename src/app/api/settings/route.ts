import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allSettings = await db.select().from(settings);

    // If no settings exist, return default
    if (allSettings.length === 0) {
      return NextResponse.json({ capital: 0 });
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
    const body = await request.json();
    const { capital } = body;

    const allSettings = await db.select().from(settings);

    if (allSettings.length === 0) {
      // Create new
      const newSettings = await db
        .insert(settings)
        .values({ capital: capital.toString() })
        .returning();
      return NextResponse.json(newSettings[0]);
    } else {
      // Update existing
      const updatedSettings = await db
        .update(settings)
        .set({ capital: capital.toString(), updatedAt: new Date() })
        .where(eq(settings.id, allSettings[0].id))
        .returning();
      return NextResponse.json(updatedSettings[0]);
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
