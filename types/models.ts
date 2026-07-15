/**
 * Core data model interfaces
 * These represent the normalized data structure used throughout the application
 */

export interface KPI {
  id: string;
  kpiName: string;
  description: string;
  departmentId: string;
  employeeId: string;
  targetValue: number;
  actualValue: number;
  status: "not-started" | "in-progress" | "at-risk" | "completed" | "overdue";
  score: number;
  dueDate: string;
  lastUpdated: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  team: string;
  position: string;
  overallScore: number;
  totalKPIs: number;
  completedKPIs: number;
  avatar?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Department {
  id: string;
  departmentName: string;
  description: string;
  averageScore: number;
  employeeCount: number;
  totalKPIs: number;
  completedKPIs: number;
  headOfDepartment: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Task {
  id: string;
  taskName: string;
  description: string;
  status: "todo" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  assignedToId: string;
  kpiId?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  employeeId: string;
  employeeName: string;
  category: "kpi-completion" | "milestone" | "excellence" | "teamwork";
  achievedAt: string;
  badge?: string;
  createdAt: string;
}

/**
 * API Response types
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
