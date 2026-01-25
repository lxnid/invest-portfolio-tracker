import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, type } = body;

    // Admin Login
    if (type === "admin") {
      if (password === ADMIN_PASSWORD) {
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
