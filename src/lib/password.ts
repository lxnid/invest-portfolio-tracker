import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a bcrypt hash
 * @param password - The plain text password to verify
 * @param hashedPassword - The bcrypt hash to compare against
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Generate a secure random token for email verification or password reset
 * @returns A URL-safe random token
 */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
