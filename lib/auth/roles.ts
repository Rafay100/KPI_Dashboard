/**
 * Role Definitions and Hierarchy
 * Defines all user roles and their hierarchical relationships
 */

import type { UserRole } from "@/types/auth";

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  executive: 4,
  "department-manager": 3,
  "team-lead": 2,
  employee: 1,
};

/**
 * Role display names
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  admin: "Administrator",
  executive: "Executive",
  "department-manager": "Department Manager",
  "team-lead": "Team Lead",
  employee: "Employee",
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full system access with all administrative privileges",
  executive: "View dashboards, reports, and rankings across the organization",
  "department-manager": "Manage department KPIs, employees, and approve updates",
  "team-lead": "Manage team tasks and KPIs",
  employee: "View and update own KPIs, tasks, and achievements",
};

/**
 * Check if a role has equal or higher privilege than another
 */
export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is exactly the specified role
 */
export function hasExactRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

/**
 * Check if a role is in the list of allowed roles
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
