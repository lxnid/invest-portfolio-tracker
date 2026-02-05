import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";
import { RateLimiter } from "@/lib/rate-limit";

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role === "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/user/profile - Update user profile (name)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role === "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (typeof name !== "string" || name.length > 255) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ name: name.trim() || null })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

// POST /api/user/profile - Change password
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role === "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting
    const limitResult = await RateLimiter.check(
      `pw-change-${session.userId}`,
      5,
      60 * 15,
    );
    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "New password must be between 8 and 128 characters" },
        { status: 400 },
      );
    }

    // Get user with password hash
    const user = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user[0].passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
