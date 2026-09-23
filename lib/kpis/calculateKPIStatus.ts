export type KPIStatus =
  | "Awaiting Approval"
  | "Awaiting Data"
  | "Missed"
  | "Behind"
  | "At Risk"
  | "On Track"
  | "Overachieved"
  | "Completed";

export interface KPIStatusInput {
  actualValue: number;
  targetValue: number;
  score: number;
  dueDate: string;
  isApproved?: boolean;
}

export function calculateKPIStatus(input: KPIStatusInput): KPIStatus {
  const now = new Date();
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  const isOverdue = dueDate && !isNaN(dueDate.getTime()) && dueDate < now && input.score < 100;

  if (input.isApproved === false) {
    return "Awaiting Approval";
  }

  if (input.targetValue <= 0 || !Number.isFinite(input.actualValue)) {
    return "Awaiting Data";
  }

  if (input.score >= 100) {
    return "Completed";
  }

  if (isOverdue) {
    return "Missed";
  }

  if (input.score >= 85) {
    return "On Track";
  }

  if (input.score >= 70) {
    return "At Risk";
  }

  return "Behind";
}


