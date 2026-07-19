import { describe, expect, it } from "vitest";
import { calculateKPIScore } from "./calculateKPIScore";

describe("calculateKPIScore", () => {
  it("calculates more-is-better scores", () => {
    expect(calculateKPIScore({ actualValue: 50, targetValue: 100 })).toBe(50);
  });

  it("handles less-is-better scoring", () => {
    expect(calculateKPIScore({ actualValue: 20, targetValue: 40, rule: "less-is-better" })).toBe(50);
  });

  it("handles range-based scoring", () => {
    expect(calculateKPIScore({ actualValue: 75, targetValue: 100, minimumValue: 50, maximumValue: 100, rule: "range" })).toBe(50);
  });
});

