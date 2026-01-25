import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Secret for signing cookies
// In production, this should be in .env
const SECRET_KEY =
  process.env.SESSION_SECRET || "default-secret-key-change-me-in-prod";
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
  userId: string;
  role: "admin" | "guest";
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Admin sessions last longer
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as any;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, role: "admin" | "guest") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expiresAt });

  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return;

  // Refresh expiration
  const parsed = await decrypt(session);
  if (!parsed) return;

  parsed.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    secure: true,
    expires: parsed.expiresAt,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
