/**
 * Session Utilities
 * Helper functions for session management
 */

import { auth } from "./auth";
import type { Session } from "@/types/auth";

/**
 * Get current session (server-side only)
 * Use this in Server Components and API routes
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth();
  return session as Session | null;
}

/**
 * Get current user (server-side only)
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated (server-side only)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Require authentication (server-side only)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific role (server-side only)
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
