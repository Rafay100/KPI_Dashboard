/**
 * NextAuth Type Augmentation
 * Extends default NextAuth types with custom fields
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "./auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      departmentId?: string;
      departmentName?: string;
      avatar?: string;
      createdAt: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    departmentId?: string;
    departmentName?: string;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    departmentId?: string;
    departmentName?: string;
    avatar?: string;
  }
}
