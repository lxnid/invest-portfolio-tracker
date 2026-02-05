import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Secret for signing cookies
const SECRET_KEY = process.env.SESSION_SECRET;

if (!SECRET_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET environment variable is required in production",
    );
  }
}
const key = new TextEncoder().encode(
  SECRET_KEY || "default-secret-key-change-me-in-prod",
);

/**
 * Securely compare two passwords using timingSafeEqual
 */
export async function comparePasswords(provided: string, actual: string) {
  // Normalize lengths to prevent length leaking (though double-HMAC is better, this is sufficient for simple token checks)
  // Actually, timingSafeEqual requires equal length buffers.
  // So we often hash both inputs first, then compare hashes.
  // Since we are comparing plain text (env var) vs provided, let's just do a simple length check first for functionality,
  // but for security we should use crypto.

  // Use Web Crypto API or Node crypto
  // Since this is Next.js edge/serverless, we might use standard crypto

  // Simple buffer compare if lengths match, else false immediately (leaks length, but acceptable here vs simple string compare)
  // Or better: Hash both, then compare.

  // We can't use crypto.timingSafeEqual on generic strings easily without equal length.
  // Simple consistent-time comparison loop is an alternative, or hashing.
  // Given user constraints and current setup, let's use a subtle crypto import if available or manual loop.
  // Actually, let's stick to standard practice:
  // If we had hashed passwords, this would be easier. Here we are comparing against an ENV var plain text.
  // So `provided === actual` is what was there.

  // Let's implement a simple constant-time compare for strings
  // Hash both inputs using SHA-256 to prevent length leakage and timing attacks
  const encoder = new TextEncoder();

  // Use Web Crypto (Edge compatible)
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(actual)),
  ]);

  const a = new Uint8Array(hashA);
  const b = new Uint8Array(hashB);

  // Constant-time comparison of hashes
  let mismatch = 0;
  for (let i = 0; i < a.length; ++i) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

export interface SessionPayload {
  userId: string;
  role: "admin" | "guest" | "user";
  email?: string;
  plan?: string;
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

export async function createSession(
  userId: string,
  role: "admin" | "guest" | "user",
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expiresAt });

  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    secure: process.env.NODE_ENV === "production",
    expires: parsed.expiresAt,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export async function deleteSession() {
  (await cookies()).set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // Expire immediately
    sameSite: "lax",
    path: "/", // Matches the path used in createSession
  });
}
