import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/auth";
import { cleanupGuestData } from "@/lib/demo-limits";

export async function POST() {
  // Get session before deleting to know the userId
  const session = await getSession();

  // Cleanup guest data if this is a guest user
  if (session && session.userId.startsWith("guest-")) {
    await cleanupGuestData(session.userId);
  }

  await deleteSession();
  // Create success response
  const response = NextResponse.json({ success: true });

  // Explicitly clear the cookie on the response object to guarantee deletion
  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    secure: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function GET() {
  // Get session before deleting to know the userId
  const session = await getSession();

  // Cleanup guest data if this is a guest user
  if (session && session.userId.startsWith("guest-")) {
    await cleanupGuestData(session.userId);
  }

  await deleteSession();
  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  );
}
