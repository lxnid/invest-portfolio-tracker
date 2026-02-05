import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const verifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { token } = parsed.data;

    // Find user with this verification token
    const matchingUsers = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));

    if (matchingUsers.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification link" },
        { status: 400 },
      );
    }

    const user = matchingUsers[0];

    // Check for expiration
    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    // Mark email as verified and clear token
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    // Create session for the user
    await createSession(user.id, "user");

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// GET handler for link clicks from email
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", request.url),
    );
  }

  // Find user with this verification token
  const matchingUsers = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token));

  if (matchingUsers.length === 0) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }

  const user = matchingUsers[0];

  // Check for expiration
  if (
    user.verificationTokenExpiresAt &&
    user.verificationTokenExpiresAt < new Date()
  ) {
    return NextResponse.redirect(
      new URL("/login?error=expired_token", request.url),
    );
  }

  if (user.emailVerified) {
    return NextResponse.redirect(
      new URL("/login?message=already_verified", request.url),
    );
  }

  // Mark email as verified and clear token
  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  // Create session for the user
  await createSession(user.id, "user");

  // Redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
