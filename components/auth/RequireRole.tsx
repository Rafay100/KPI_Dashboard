"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/auth";

interface RequireRoleProps {
  children: React.ReactNode;
  role?: UserRole;
  resource?: string;
  action?: "create" | "read" | "update" | "delete" | "approve";
}

export function RequireRole({
  children,
  role,
  resource,
  action = "read",
}: RequireRoleProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && role && userRole && userRole !== role) {
      router.replace("/access-denied");
    }
  }, [router, role, userRole, status]);

  if (status === "loading") {
    return <div className="p-6 text-sm text-slate-400">Loading session...</div>;
  }

  if (!session?.user) {
    return null;
  }

  if (role && userRole !== role) {
    return null;
  }

  if (resource && userRole && !hasPermission(userRole, resource, action)) {
    return null;
  }

  return <>{children}</>;
}
