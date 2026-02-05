import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/password";
import { RateLimiter } from "@/lib/rate-limit";
import { Resend } from "resend";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Rate limit by email
    const limitResult = await RateLimiter.check(`reset-${email}`, 3, 60 * 60);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429 },
      );
    }

    // Find user - always return success to prevent email enumeration
    const matchingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (matchingUsers.length > 0) {
      const user = matchingUsers[0];

      // Generate reset token with 1 hour expiry
      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .update(users)
        .set({
          resetToken,
          resetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Send reset email
      const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

      try {
        await resend.emails.send({
          from: `${APP_NAME} <noreply@${new URL(APP_URL).hostname}>`,
          to: email,
          subject: `Reset your ${APP_NAME} password`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #09090b;">Reset your password</h1>
              <p>You requested to reset your password. Click the button below to set a new password:</p>
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #71717a; font-size: 14px;">
                Or copy and paste this link: ${resetUrl}
              </p>
              <p style="color: #71717a; font-size: 14px;">
                This link will expire in 1 hour.
              </p>
              <p style="color: #71717a; font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
