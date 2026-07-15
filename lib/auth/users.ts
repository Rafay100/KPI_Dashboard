/**
 * Demo Users Database
 * Predefined users for authentication demo
 * In production, this would be stored in a database
 */

import type { AuthUser } from "@/types/auth";
import bcrypt from "bcryptjs";

/**
 * Demo user credentials
 * All users have password: Password123
 */
const DEMO_PASSWORD_HASH = bcrypt.hashSync("Password123", 10);

export const DEMO_USERS: AuthUser[] = [
  {
    id: "user-admin-001",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    password: DEMO_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-exec-001",
    name: "Executive Director",
    email: "executive@example.com",
    role: "executive",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Executive",
    password: DEMO_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-mgr-001",
    name: "Sarah Johnson",
    email: "manager@example.com",
    role: "department-manager",
    departmentId: "dept-001",
    departmentName: "Sales",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    password: DEMO_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-lead-001",
    name: "Michael Chen",
    email: "lead@example.com",
    role: "team-lead",
    departmentId: "dept-002",
    departmentName: "Engineering",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    password: DEMO_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-emp-001",
    name: "Emma Wilson",
    email: "employee@example.com",
    role: "employee",
    departmentId: "dept-003",
    departmentName: "Marketing",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    password: DEMO_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Find user by email
 */
export function findUserByEmail(email: string): AuthUser | undefined {
  return DEMO_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find user by ID
 */
export function findUserById(id: string): AuthUser | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}

/**
 * Verify user password
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Get user without password (safe for client)
 */
export function sanitizeUser(user: AuthUser): Omit<AuthUser, "password"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}
