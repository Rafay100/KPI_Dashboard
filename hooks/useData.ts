import { useQuery } from "@tanstack/react-query";
import type {
  KPI,
  Employee,
  Department,
  Task,
  Achievement,
  APIResponse,
} from "@/types/models";

/**
 * Custom hooks for fetching data from API endpoints
 * These hooks use TanStack Query for caching, loading states, and error handling
 */

const API_BASE = "/api";

interface DashboardData {
  kpis: KPI[];
  employees: Employee[];
  departments: Department[];
  tasks: Task[];
  achievements: Achievement[];
}

/**
 * Fetch all dashboard data in ONE optimized request
 * This replaces 5 separate API calls with a single parallel fetch
 */
export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/dashboard`, {
        cache: "no-store",
        next: { revalidate: 300 } // 5 minute revalidation
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const result: APIResponse<DashboardData> = await response.json();
      return result.data || {
        kpis: [],
        employees: [],
        departments: [],
        tasks: [],
        achievements: [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on every window focus
  });
}

/**
 * Individual hooks for backward compatibility
 * These now extract data from the unified dashboard query
 */
export function useKPIs() {
  const query = useDashboardData();
  return {
    data: query.data?.kpis || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useEmployees() {
  const query = useDashboardData();
  return {
    data: query.data?.employees || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDepartments() {
  const query = useDashboardData();
  return {
    data: query.data?.departments || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTasks() {
  const query = useDashboardData();
  return {
    data: query.data?.tasks || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAchievements() {
  const query = useDashboardData();
  return {
    data: query.data?.achievements || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface KPIHistoryItem {
  id: string;
  kpiId: string;
  kpiName: string;
  previousValue: number;
  newValue: number;
  previousScore: number;
  newScore: number;
  statusAfterUpdate: string;
  updatedBy: string;
  approvalStatus: string;
  updateDate: string;
}

export function useKPIHistory(kpiId: string) {
  return useQuery<KPIHistoryItem[]>({
    queryKey: ["kpi-history", kpiId],
    queryFn: async () => {
      if (!kpiId) return [];
      const response = await fetch(`${API_BASE}/kpis/${kpiId}/history`);
      if (!response.ok) throw new Error("Failed to fetch KPI history");
      const result: APIResponse<KPIHistoryItem[]> = await response.json();
      return result.data || [];
    },
    enabled: !!kpiId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useEmployeeHistory(employeeId: string) {
  return useQuery<KPIHistoryItem[]>({
    queryKey: ["employee-history", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const response = await fetch(`${API_BASE}/employees/${employeeId}/history`);
      if (!response.ok) throw new Error("Failed to fetch Employee history");
      const result: APIResponse<KPIHistoryItem[]> = await response.json();
      return result.data || [];
    },
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000,
  });
}
