import { describe, expect, it } from "vitest";
import { isOverdue } from "./isOverdue";

describe("isOverdue", () => {
  it("flags past due unfinished tasks", () => {
    expect(isOverdue("2000-01-01", false, "in-progress")).toBe(true);
  });

  it("does not flag completed tasks", () => {
    expect(isOverdue("2000-01-01", true, "completed")).toBe(false);
  });
});
