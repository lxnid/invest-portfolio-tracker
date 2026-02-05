import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/user/onboarding - Check if onboarding is completed
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role === "guest") {
      // Guests don't see onboarding
      return NextResponse.json({ completed: true });
    }

    const user = await db
      .select({ onboardingCompletedAt: users.onboardingCompletedAt })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ completed: true });
    }

    return NextResponse.json({
      completed: user[0].onboardingCompletedAt !== null,
    });
  } catch (error) {
    console.error("Onboarding status check error:", error);
    return NextResponse.json({ completed: true }); // Default to completed on error
  }
}

// POST /api/user/onboarding - Mark onboarding as completed
export async function POST() {
  try {
    const session = await getSession();

    if (!session || session.role === "guest") {
      return NextResponse.json({ success: true });
    }

    await db
      .update(users)
      .set({ onboardingCompletedAt: new Date() })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 },
    );
  }
}
