import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { updateSession, getSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await getSession();

  // 1. Protect all routes except public pages, assets, and auth endpoints
  if (!session) {
    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/register") &&
      !request.nextUrl.pathname.startsWith("/forgot-password") &&
      !request.nextUrl.pathname.startsWith("/reset-password") &&
      !request.nextUrl.pathname.startsWith("/offline") &&
      request.nextUrl.pathname !== "/" &&
      !request.nextUrl.pathname.startsWith("/api/auth") &&
      !request.nextUrl.pathname.startsWith("/_next") &&
      !request.nextUrl.pathname.startsWith("/static") &&
      !request.nextUrl.pathname.includes(".") // Files like favicon.ico
    ) {
      // If it's an API route, return 401 JSON instead of redirecting
      if (request.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Otherwise redirect to login page
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Refresh session if active
  if (session) {
    // If on login page and already logged in, redirect to dashboard
    if (request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Guest users are now allowed to write (with limits enforced in API routes)
    // Data cleanup happens on logout

    // Skip session refresh for logout route to prevent cookie conflict
    if (request.nextUrl.pathname.startsWith("/api/auth/logout")) {
      return NextResponse.next();
    }
  }

  const response = session ? await updateSession() : NextResponse.next();

  // Add Security Headers
  if (response) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://s3.tradingview.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: https://cloudflareinsights.com; font-src 'self' https:; frame-src 'self' https://s.tradingview.com;",
    );
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
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
