import { describe, expect, it } from "vitest";
import { mapKPIFromAirtable } from "./mappers";

describe("mapKPIFromAirtable", () => {
  it("reads KPI records when Airtable uses human-readable field names", () => {
    const record = {
      id: "rec-1",
      fields: {
        "KPI Name": "Quarterly Sales",
        Description: "Grow revenue",
        "Department ID": "dept-1",
        "Employee ID": "emp-1",
        "Target Value": 100,
        "Actual Value": 40,
        Status: "in-progress",
        Score: 40,
        "Due Date": "2026-12-31",
        "Last Updated": "2026-07-08",
      },
    } as any;

    const mapped = mapKPIFromAirtable(record);

    expect(mapped.kpiName).toBe("Quarterly Sales");
    expect(mapped.departmentId).toBe("dept-1");
    expect(mapped.employeeId).toBe("emp-1");
    expect(mapped.targetValue).toBe(100);
    expect(mapped.actualValue).toBe(40);
    expect(mapped.status).toBe("in-progress");
  });
});
