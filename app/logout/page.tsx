"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
    router.replace("/login");
  }, [router]);

  return null;
}
