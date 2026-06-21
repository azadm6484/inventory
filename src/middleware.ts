import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth/auth-config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  // Do not redirect or intercept static asset requests (e.g. images, icons, manifest, next assets)
  if (
    nextUrl.pathname.includes(".") ||
    nextUrl.pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route)) || nextUrl.pathname === "/";
  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  // 1. If not logged in and accessing a protected page, redirect to login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // 2. If logged in and accessing auth pages (login/register), redirect to dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 3. Role-based checks for pages
  if (isLoggedIn) {
    // Admin only routes: /users, /settings
    const isAdminRoute = nextUrl.pathname.startsWith("/users") || nextUrl.pathname.startsWith("/settings");
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
