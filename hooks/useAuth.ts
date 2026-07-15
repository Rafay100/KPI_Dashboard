"use client";

import type { User } from "@/types/auth";

export interface AuthState {
  user: User | null;
  isLoading: false;
  isAuthenticated: true;
}

export function useAuth(): AuthState {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: true,
  };
}