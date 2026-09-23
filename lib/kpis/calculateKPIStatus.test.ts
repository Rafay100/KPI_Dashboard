import { describe, expect, it } from "vitest";
import { calculateKPIStatus } from "./calculateKPIStatus";

describe("calculateKPIStatus", () => {
  it("returns Completed when score is >= 100", () => {
    expect(calculateKPIStatus({ actualValue: 100, targetValue: 100, score: 100, dueDate: "2099-01-01" })).toBe("Completed");
    expect(calculateKPIStatus({ actualValue: 110, targetValue: 100, score: 110, dueDate: "2099-01-01" })).toBe("Completed");
  });

  it("returns On Track when score is >= 85 and < 100", () => {
    expect(calculateKPIStatus({ actualValue: 88, targetValue: 100, score: 88, dueDate: "2099-01-01" })).toBe("On Track");
  });

  it("returns At Risk when score is >= 70 and < 85", () => {
    expect(calculateKPIStatus({ actualValue: 72, targetValue: 100, score: 72, dueDate: "2099-01-01" })).toBe("At Risk");
  });

  it("returns Behind when score is < 70 and not overdue", () => {
    expect(calculateKPIStatus({ actualValue: 50, targetValue: 100, score: 50, dueDate: "2099-01-01" })).toBe("Behind");
  });

  it("returns Missed when score is < 100 and dueDate is in past", () => {
    expect(calculateKPIStatus({ actualValue: 50, targetValue: 100, score: 50, dueDate: "2020-01-01" })).toBe("Missed");
  });

  it("returns awaiting approval when not approved", () => {
    expect(calculateKPIStatus({ actualValue: 50, targetValue: 100, score: 50, dueDate: "2099-01-01", isApproved: false })).toBe("Awaiting Approval");
  });

  it("returns Awaiting Data when targetValue or actualValue is invalid", () => {
    expect(calculateKPIStatus({ actualValue: 0, targetValue: 0, score: 0, dueDate: "2099-01-01" })).toBe("Awaiting Data");
  });
});
