/**
 * Permission Matrix
 * Defines what each role can access and what actions they can perform
 */

import type { UserRole, RolePermissions } from "@/types/auth";

/**
 * Complete permission matrix by role
 */
export const PERMISSIONS_BY_ROLE: Record<UserRole, RolePermissions> = {
  admin: {
    role: "admin",
    description: "Full access to all features and administrative functions",
    permissions: [
      { resource: "dashboard", actions: ["read"] },
      { resource: "kpis", actions: ["create", "read", "update", "delete", "approve"] },
      { resource: "departments", actions: ["create", "read", "update", "delete"] },
      { resource: "employees", actions: ["create", "read", "update", "delete"] },
      { resource: "tasks", actions: ["create", "read", "update", "delete"] },
      { resource: "achievements", actions: ["create", "read", "update", "delete"] },
      { resource: "reports", actions: ["read"] },
      { resource: "rankings", actions: ["read"] },
      { resource: "settings", actions: ["read", "update"] },
      { resource: "data-sources", actions: ["read", "update"] },
      { resource: "import-mapping", actions: ["read", "update"] },
      { resource: "approvals", actions: ["read", "approve"] },
    ],
  },
  executive: {
    role: "executive",
    description: "View-only access to dashboards, reports, and organizational metrics",
    permissions: [
      { resource: "dashboard", actions: ["read"] },
      { resource: "kpis", actions: ["read"] },
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
      { resource: "tasks", actions: ["read"] },
      { resource: "achievements", actions: ["read"] },
      { resource: "reports", actions: ["read"] },
      { resource: "rankings", actions: ["read"] },
      { resource: "approvals", actions: ["read", "approve"] },
    ],
  },
  "department-manager": {
    role: "department-manager",
    description: "Manage department KPIs, employees, and approve departmental updates",
    permissions: [
      { resource: "dashboard", actions: ["read"] },
      { resource: "kpis", actions: ["read", "update", "approve"] }, // Department KPIs only
      { resource: "departments", actions: ["read"] }, // Own department
      { resource: "employees", actions: ["read"] }, // Department employees
      { resource: "tasks", actions: ["read", "update"] }, // Department tasks
      { resource: "achievements", actions: ["read"] },
      { resource: "reports", actions: ["read"] }, // Department reports
      { resource: "rankings", actions: ["read"] },
      { resource: "approvals", actions: ["read", "approve"] }, // Department approvals
    ],
  },
  "team-lead": {
    role: "team-lead",
    description: "Manage team tasks and KPIs",
    permissions: [
      { resource: "dashboard", actions: ["read"] },
      { resource: "kpis", actions: ["read", "update"] }, // Team KPIs only
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] }, // Team members
      { resource: "tasks", actions: ["create", "read", "update"] }, // Team tasks
      { resource: "achievements", actions: ["read"] },
      { resource: "rankings", actions: ["read"] },
    ],
  },
  employee: {
    role: "employee",
    description: "View and update own KPIs, tasks, and achievements",
    permissions: [
      { resource: "dashboard", actions: ["read"] },
      { resource: "kpis", actions: ["read", "update"] }, // Own KPIs only
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
      { resource: "tasks", actions: ["read", "update"] }, // Own tasks
      { resource: "achievements", actions: ["read"] }, // Own achievements
    ],
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: "create" | "read" | "update" | "delete" | "approve"
): boolean {
  const rolePermissions = PERMISSIONS_BY_ROLE[userRole];
  const resourcePermission = rolePermissions.permissions.find((p) => p.resource === resource);

  if (!resourcePermission) {
    return false;
  }

  return resourcePermission.actions.includes(action);
}

/**
 * Check if a role can access a specific route
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  const rolePriority: Record<UserRole, number> = {
    admin: 5,
    executive: 4,
    "department-manager": 3,
    "team-lead": 2,
    employee: 1,
  };

  return rolePriority[userRole] >= rolePriority[requiredRole];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Public routes (login, logout)
  if (route === "/login" || route === "/logout") {
    return true;
  }

  // Map routes to resources
  const routeResourceMap: Record<string, { resource: string; action: "create" | "read" | "update" | "delete" | "approve" }> = {
    "/": { resource: "dashboard", action: "read" },
    "/kpi-tracking-board": { resource: "kpis", action: "read" },
    "/live-kpi-tracking": { resource: "kpis", action: "read" },
    "/kpi-monitoring": { resource: "kpis", action: "read" },
    "/create-kpi": { resource: "kpis", action: "create" },
    "/kpis": { resource: "kpis", action: "read" },
    "/employee-rankings": { resource: "rankings", action: "read" },
    "/department-rankings": { resource: "rankings", action: "read" },
    "/task-tracking": { resource: "tasks", action: "read" },
    "/achievements": { resource: "achievements", action: "read" },
    "/reports": { resource: "reports", action: "read" },
    "/settings": { resource: "settings", action: "read" },
    "/data-sources": { resource: "data-sources", action: "read" },
    "/import-mapping": { resource: "import-mapping", action: "read" },
    "/approvals": { resource: "approvals", action: "read" },
  };

  const routePermission = routeResourceMap[route];

  if (!routePermission) {
    // Unknown route, deny access
    return false;
  }

  return hasPermission(userRole, routePermission.resource, routePermission.action);
}

/**
 * Get all accessible routes for a role
 */
export function getAccessibleRoutes(userRole: UserRole): string[] {
  const routes = [
    "/",
    "/kpi-tracking-board",
    "/live-kpi-tracking",
    "/kpi-monitoring",
    "/create-kpi",
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

  return routes.filter((route) => canAccessRoute(userRole, route));
}
