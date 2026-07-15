"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh for 10 min
            gcTime: 15 * 60 * 1000, // 15 minutes - keep cached data in memory
            retry: 1, // Only retry once to avoid long waits
            refetchOnWindowFocus: false, // Don't refetch when switching tabs
            refetchOnReconnect: false, // Don't refetch on internet reconnect
            refetchOnMount: false, // Don't refetch when component mounts if data exists
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
