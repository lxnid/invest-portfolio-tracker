import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, generateToken } from "@/lib/password";
import { RateLimiter } from "@/lib/rate-limit";
import { Resend } from "resend";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  name: z.string().max(255).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 registrations per hour per IP
    let ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (!ip) {
      ip = "unknown-" + crypto.randomUUID();
    }
    const limitResult = await RateLimiter.check(ip, 3, 60 * 60);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    // Check if email already exists
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password and generate verification token
    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();
    const userId = crypto.randomUUID();

    // Create user (catch race condition on duplicate email)
    try {
      await db.insert(users).values({
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        plan: "free",
      });
    } catch (err: unknown) {
      // PostgreSQL unique_violation error code
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "23505"
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }
      throw err;
    }

    // Send verification email
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: `${APP_NAME} <noreply@${new URL(APP_URL).hostname}>`,
        to: email,
        subject: `Verify your ${APP_NAME} account`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #09090b;">Welcome to ${APP_NAME}!</h1>
            <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #71717a; font-size: 14px;">
              Or copy and paste this link: ${verificationUrl}
            </p>
            <p style="color: #71717a; font-size: 14px;">
              This link will expire in 24 hours.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails - user can request resend
    }

    return NextResponse.json({
      success: true,
      message:
        "Account created. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
