/**
 * Permissions hook
 * Check user permissions in Client Components
 */

"use client";

import { useSession } from "./useAuth";
import { hasPermission, canAccessRoute, hasAnyRole, hasRoleOrHigher } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/auth";

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { user } = useSession();

  const checkPermission = (
    resource: string,
    action: "create" | "read" | "update" | "delete" | "approve"
  ): boolean => {
    if (!user) return false;
    return hasPermission(user.role, resource, action);
  };

  const checkRoute = (route: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role, route);
  };

  const checkRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return hasAnyRole(user.role, allowedRoles);
  };

  const checkRoleOrHigher = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return hasRoleOrHigher(user.role, requiredRole);
  };

  return {
    canCreate: (resource: string) => checkPermission(resource, "create"),
    canRead: (resource: string) => checkPermission(resource, "read"),
    canUpdate: (resource: string) => checkPermission(resource, "update"),
    canDelete: (resource: string) => checkPermission(resource, "delete"),
    canApprove: (resource: string) => checkPermission(resource, "approve"),
    canAccessRoute: checkRoute,
    hasRole: checkRole,
    hasRoleOrHigher: checkRoleOrHigher,
  };
}
