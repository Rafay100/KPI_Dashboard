/**
 * Client-side authentication hooks
 * Use these in Client Components
 */

"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import type { User } from "@/types/auth";

/**
 * Get current session (client-side)
 */
export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    user: session?.user as User | undefined,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status,
  };
}

/**
 * Get current user (client-side)
 */
export function useUser() {
  const { user, isLoading } = useSession();
  return { user, isLoading };
}

/**
 * Check if user is authenticated (client-side)
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useSession();
  return { isAuthenticated, isLoading };
}
