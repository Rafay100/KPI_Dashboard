/**
 * Authentication and Authorization Types
 */

export type UserRole = "admin" | "executive" | "department-manager" | "team-lead" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  avatar?: string;
  createdAt: string;
}

export interface Session {
  user: User;
  expires: string;
}

export interface AuthUser extends User {
  password?: string; // Only used internally, never exposed to client
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Permission {
  resource: string;
  actions: ("create" | "read" | "update" | "delete" | "approve")[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}
