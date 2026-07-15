/**
 * Auth.js Configuration
 * NextAuth v5 configuration for the KPI Dashboard
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { User as AuthUser } from "next-auth";
import type { User } from "@/types/auth";
import { findUserByEmail, verifyPassword, sanitizeUser } from "./users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = findUserByEmail(credentials.email as string);

        if (!user || !user.password) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // Return user without password
        const safeUser = sanitizeUser(user);
        return {
          id: safeUser.id,
          name: safeUser.name,
          email: safeUser.email,
          image: safeUser.avatar,
          // Custom fields will be added in JWT callback
        } as AuthUser;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add custom user data to token
      if (user) {
        const fullUser = findUserByEmail(user.email!);
        if (fullUser) {
          token.id = fullUser.id;
          token.role = fullUser.role;
          token.departmentId = fullUser.departmentId;
          token.departmentName = fullUser.departmentName;
          token.avatar = fullUser.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom data to session
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as User["role"];
        session.user.departmentId = token.departmentId as string | undefined;
        session.user.departmentName = token.departmentName as string | undefined;
        session.user.avatar = token.avatar as string | undefined;
        session.user.createdAt = new Date().toISOString();
      }
      return session;
    },
    async authorized({ auth }) {
      // This callback is used by middleware
      return !!auth?.user;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
});
