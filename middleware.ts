/**
 * Middleware for route protection
 * Protects routes based on authentication and authorization
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { canAccessRoute } from "@/lib/auth/permissions";

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/login", "/logout"];

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/",
  "/kpi-tracking-board",
  "/live-kpi-tracking",
  "/kpi-monitoring",
  "/create-kpi",
  "/kpis",
  "/employee-rankings",
  "/department-rankings",
  "/task-tracking",
  "/achievements",
  "/reports",
  "/settings",
  "/data-sources",
  "/import-mapping",
  "/approvals",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Redirect to login if not authenticated
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has permission to access this route
    const userRole = session.user.role;
    const hasAccess = canAccessRoute(userRole, pathname);

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
