import { NextResponse } from "next/server";
import { createSession, comparePasswords } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/password";
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
      ip = "unknown-ip"; // Static fallback key to ensure rate limiting applies
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

      // 1. Always fetch user first to normalize timing flow
      let user = (
        await db.select().from(users).where(eq(users.email, emailLower))
      )[0];

      // 2. Special handling for Admin: Sync to DB if needed
      // This logic runs if the admin is trying to log in but isn't in the DB yet (first run)
      // or if we want to ensure sync.
      if (emailLower === ADMIN_EMAIL && !user) {
        // Check ENV password (Fast)
        const isValidEnv = await comparePasswords(
          data.password,
          ADMIN_PASSWORD!,
        );

        if (isValidEnv) {
          // Valid Admin credential -> Sync to DB now
          try {
            const adminPasswordHash = await hashPassword(ADMIN_PASSWORD!);
            const newUser = await db
              .insert(users)
              .values({
                id: "admin-user",
                email: ADMIN_EMAIL,
                passwordHash: adminPasswordHash,
                name: "Admin User",
                plan: "pro",
                emailVerified: true,
                lastLoginAt: new Date(),
              })
              .onConflictDoUpdate({
                target: users.email,
                set: {
                  id: "admin-user",
                  passwordHash: adminPasswordHash,
                  lastLoginAt: new Date(),
                },
              })
              .returning();

            user = newUser[0];
            console.log("Admin user synced to database during login");
          } catch (err) {
            console.error("Failed to sync admin user:", err);
            // Verify continues below, but user will be undefined so it will fail safely
          }
        }
      }

      // 3. Consistent timing check (Always use bcrypt)
      // Use cost factor 10 to match SALT_ROUNDS
      const dummyHash =
        "$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5YRPJmRqG6Woy";

      const isValid = await verifyPassword(
        data.password,
        user?.passwordHash || dummyHash,
      );

      if (!user || !isValid) {
        // Return generic error message
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Check if email is verified
      if (!user.emailVerified) {
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
