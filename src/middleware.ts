/**
 * Edge Routing Authentication Middleware for CodeForge Runner.
 * Enforces session protection: redirects unauthenticated users to /login,
 * and redirects authenticated sessions attempting to access /login back to Dashboard.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isSeedApi = pathname.startsWith("/api/seed");
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  // Always allow static assets and public authentication API routes
  if (isStaticFile || isAuthApi || isSeedApi) {
    return NextResponse.next();
  }

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (!token && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users trying to access /login -> redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
