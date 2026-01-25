import { NextResponse } from "next/server";
import { createSession, comparePasswords } from "@/lib/auth";
import { z } from "zod";
import { RateLimiter } from "@/lib/rate-limit";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    let ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (!ip) {
      console.warn("Missing IP in login request");
      ip = "unknown-" + crypto.randomUUID(); // Fail open: don't block all unknown IPs together
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
    const schema = z.object({
      password: z.string().min(1),
      type: z.enum(["admin", "guest"]),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { password, type } = parsed.data;

    // Admin Login
    console.log("Admin login attempt");
    if (type === "admin") {
      const isValid = await comparePasswords(password, ADMIN_PASSWORD!);
      if (isValid) {
        await createSession("admin-user", "admin");
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 },
        );
      }
    }

    // Guest Login
    if (type === "guest") {
      // Generate random guest ID
      const guestId = `guest-${crypto.randomUUID()}`;
      await createSession(guestId, "guest");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
