import { describe, expect, it } from "vitest";
import { calculateKPIStatus } from "./calculateKPIStatus";

describe("calculateKPIStatus", () => {
  it("returns completed when score is 100", () => {
    expect(calculateKPIStatus({ actualValue: 100, targetValue: 100, score: 100, dueDate: "2099-01-01" })).toBe("Completed");
  });

  it("returns awaiting approval when not approved", () => {
    expect(calculateKPIStatus({ actualValue: 50, targetValue: 100, score: 50, dueDate: "2099-01-01", isApproved: false })).toBe("Awaiting Approval");
  });
});

