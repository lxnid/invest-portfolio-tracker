import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { updateSession, getSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await getSession();

  // 1. Protect all routes except /login, public assets, and api/login
  if (!session) {
    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/api/auth") && // Allow login endpoint
      !request.nextUrl.pathname.startsWith("/_next") &&
      !request.nextUrl.pathname.startsWith("/static") &&
      !request.nextUrl.pathname.includes(".") // Files like favicon.ico
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Refresh session if active
  if (session) {
    // If on login page and already logged in, redirect to dashboard
    if (request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based protection for "Demo" users trying to mutate data
    // GET requests are safe (read-only)
    // POST/PUT/DELETE are blocked for "guest" role
    if (
      session.role === "guest" &&
      request.method !== "GET" &&
      request.nextUrl.pathname.startsWith("/api")
    ) {
      return NextResponse.json(
        { error: "Demo users function in Read-Only mode." },
        { status: 403 },
      );
    }

    return await updateSession();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
