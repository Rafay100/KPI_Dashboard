import { z } from "zod";

/**
 * Zod validation schemas for API requests and data validation
 */

export const KPISchema = z.object({
  id: z.string(),
  kpiName: z.string().min(1, "KPI name is required"),
  description: z.string().optional(),
  departmentId: z.string().min(1, "Department ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  targetValue: z.number().min(0, "Target value must be positive"),
  actualValue: z.number().min(0, "Actual value must be positive"),
  status: z.enum([
    "not-started",
    "in-progress",
    "at-risk",
    "completed",
    "overdue",
  ]),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  dueDate: z.string(),
  lastUpdated: z.string(),
  createdAt: z.string(),
});

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  department: z.string().min(1, "Department is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  team: z.string().optional(),
  position: z.string().optional(),
  overallScore: z.number().min(0).max(100),
  totalKPIs: z.number().min(0),
  completedKPIs: z.number().min(0),
  avatar: z.string().optional(),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export const DepartmentSchema = z.object({
  id: z.string(),
  departmentName: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  averageScore: z.number().min(0).max(100),
  employeeCount: z.number().min(0),
  totalKPIs: z.number().min(0),
  completedKPIs: z.number().min(0),
  headOfDepartment: z.string().optional(),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export const TaskSchema = z.object({
  id: z.string(),
  taskName: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "completed", "blocked"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().min(1, "Assigned to is required"),
  assignedToId: z.string().min(1, "Assigned to ID is required"),
  kpiId: z.string().optional(),
  dueDate: z.string(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  points: z.number().min(0, "Points must be positive"),
  employeeId: z.string().min(1, "Employee ID is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  category: z.enum([
    "kpi-completion",
    "milestone",
    "excellence",
    "teamwork",
  ]),
  achievedAt: z.string(),
  badge: z.string().optional(),
  createdAt: z.string(),
});

export const CreateKPISchema = z.object({
  kpiName: z.string().min(1, "KPI name is required"),
  description: z.string().optional(),
  departmentId: z.string().min(1, "Department ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  targetValue: z.number().min(0, "Target value must be positive"),
  actualValue: z.number().min(0, "Actual value must be positive").default(0),
  status: z
    .enum(["not-started", "in-progress", "at-risk", "completed", "overdue"])
    .default("not-started"),
  dueDate: z.string(),
});

export const UpdateKPISchema = z.object({
  kpiName: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.number().min(0).optional(),
  actualValue: z.number().min(0).optional(),
  status: z
    .enum(["not-started", "in-progress", "at-risk", "completed", "overdue"])
    .optional(),
  dueDate: z.string().optional(),
});

export type KPIInput = z.infer<typeof KPISchema>;
export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type DepartmentInput = z.infer<typeof DepartmentSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type AchievementInput = z.infer<typeof AchievementSchema>;
export type CreateKPIInput = z.infer<typeof CreateKPISchema>;
export type UpdateKPIInput = z.infer<typeof UpdateKPISchema>;
