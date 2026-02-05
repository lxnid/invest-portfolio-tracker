import { NextResponse } from "next/server";
import { createSession, comparePasswords } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";
import { RateLimiter } from "@/lib/rate-limit";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}
if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL environment variable is required");
}

const loginSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("guest"),
  }),
  z.object({
    type: z.literal("user"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
]);

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    let ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (!ip) {
      console.warn("Missing IP in login request");
      ip = "unknown-" + crypto.randomUUID();
    }
    const limitResult = await RateLimiter.check(ip, 5, 60 * 15); // 5 attempts per 15 mins

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // 2. Input Validation
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Guest Login
    if (data.type === "guest") {
      const guestId = `guest-${crypto.randomUUID()}`;
      await createSession(guestId, "guest");
      return NextResponse.json({ success: true });
    }

    // User Login (email/password)
    if (data.type === "user") {
      const emailLower = data.email.toLowerCase();

      // Hidden admin login - check for secret admin email
      if (emailLower === ADMIN_EMAIL) {
        console.log("Admin login attempt via hidden email");
        const isValid = await comparePasswords(data.password, ADMIN_PASSWORD!);
        if (isValid) {
          await createSession("admin-user", "admin");
          return NextResponse.json({ success: true });
        } else {
          // Use same error message to not reveal admin email exists
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 },
          );
        }
      }

      console.log("User login attempt:", emailLower);

      // Find user by email
      const matchingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, emailLower));

      const user = matchingUsers[0];

      // Use a dummy hash if user doesn't exist to maintain consistent timing
      // This prevents timing attacks that leak whether an email is registered
      const dummyHash =
        "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5YRPJmRqG6Woy";
      const isValid = await verifyPassword(
        data.password,
        user?.passwordHash || dummyHash,
      );

      if (!user || !isValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Check if email is verified
      if (!user.emailVerified) {
        // Return same 401 error to prevent enumeration of unverified accounts (security best practice)
        // But logging the actual reason for debugging
        console.log(`Login blocked: User ${user.email} is not verified`);
        return NextResponse.json(
          {
            error:
              "Invalid email or password. You may need to verify your email.",
          },
          { status: 401 },
        );
      }

      // Update last login time
      try {
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));
      } catch (err) {
        console.error("Failed to update last login:", err);
        // Continue login even if update fails
      }

      await createSession(user.id, "user");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid login type" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
