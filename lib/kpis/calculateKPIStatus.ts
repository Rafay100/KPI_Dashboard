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
  const dueDate = new Date(input.dueDate);
  const isOverdue = dueDate < now && input.score < 100;

  if (input.score >= 100) {
    return "Completed";
  }

  if (input.isApproved === false) {
    return "Awaiting Approval";
  }

  if (input.targetValue <= 0) {
    return "Awaiting Data";
  }

  if (input.actualValue <= 0) {
    return "Awaiting Data";
  }

  if (input.score >= 100) {
    return "Completed";
  }

  if (input.score >= 90) {
    return "Overachieved";
  }

  if (isOverdue) {
    return "Missed";
  }

  if (input.score >= 70) {
    return "On Track";
  }

  if (input.score >= 50) {
    return "Behind";
  }

  return "At Risk";
}
