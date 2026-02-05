import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

import { RateLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    let ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (!ip) {
      ip = "unknown-" + crypto.randomUUID();
    }
    // 5 attempts per 15 mins (same as login)
    const limitResult = await RateLimiter.check(ip, 5, 60 * 15);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    // Find user with valid reset token
    const matchingUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiry, new Date()),
        ),
      );

    if (matchingUsers.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    const user = matchingUsers[0];

    // Hash new password and clear reset token
    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        // Also verify email if not already verified
        emailVerified: true,
        verificationToken: null,
      })
      .where(eq(users.id, user.id));

    // Create session for the user
    await createSession(user.id, "user");

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
