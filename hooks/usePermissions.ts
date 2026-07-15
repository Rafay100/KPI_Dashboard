

"use client";

/**
 * Hook to check user permissions
 * Auth disabled — always grants access
 */
export function usePermissions() {
  return {
    canCreate: (_resource: string) => true,
    canRead: (_resource: string) => true,
    canUpdate: (_resource: string) => true,
    canDelete: (_resource: string) => true,
    canApprove: (_resource: string) => true,
    canAccessRoute: (_route: string) => true,
    hasRole: (_allowedRoles: string[]) => true,
    hasRoleOrHigher: (_requiredRole: string) => true,
  };
}