import { z } from "zod";

/**
 * Zod validation schemas for API requests and data validation
 */

export const KPISchema = z.object({
  id: z.string(),
  kpiName: z.string().min(1, "KPI name is required"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  targetValue: z.number().optional(),
  actualValue: z.number().optional(),
  status: z.string().optional().default("not-started"),
  score: z.number().optional().default(0),
  dueDate: z.string().optional(),
  lastUpdated: z.string().optional(),
  createdAt: z.string().optional(),
  code: z.string().optional(),
  category: z.string().optional(),
  team: z.string().optional(),
  owner: z.string().optional(),
  frequency: z.string().optional(),
  unit: z.string().optional(),
});

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  department: z.string().optional(),
  departmentId: z.string().optional(),
  team: z.string().optional(),
  position: z.string().optional(),
  overallScore: z.number().optional().default(0),
  totalKPIs: z.number().optional().default(0),
  completedKPIs: z.number().optional().default(0),
  avatar: z.string().optional(),
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
  manager: z.string().optional(),
});

export const DepartmentSchema = z.object({
  id: z.string(),
  departmentName: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  averageScore: z.number().optional().default(0),
  employeeCount: z.number().optional().default(0),
  totalKPIs: z.number().optional().default(0),
  completedKPIs: z.number().optional().default(0),
  headOfDepartment: z.string().optional(),
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  taskName: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  status: z.string().optional().default("todo"),
  priority: z.string().optional().default("medium"),
  assignedTo: z.string().optional(),
  assignedToId: z.string().optional(),
  kpiId: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  points: z.number().optional().default(0),
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
  category: z.string().optional().default("excellence"),
  achievedAt: z.string().optional(),
  badge: z.string().optional(),
  createdAt: z.string().optional(),
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
  code: z.string().optional(),
  category: z.string().optional(),
  team: z.string().optional(),
  owner: z.string().optional(),
  frequency: z.string().optional(),
  unit: z.string().optional(),
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
