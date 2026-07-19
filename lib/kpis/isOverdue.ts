export function isOverdue(dueDate: string, completed: boolean, status?: string): boolean {
  if (completed) return false;
  if (status === "cancelled" || status === "overachieved") return false;

  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
}

