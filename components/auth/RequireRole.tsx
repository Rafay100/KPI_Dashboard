"use client";

interface RequireRoleProps {
  children: React.ReactNode;
}

export function RequireRole({ children }: RequireRoleProps) {
  return <>{children}</>;
}