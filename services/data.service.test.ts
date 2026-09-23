import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAdapter = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
};

vi.mock("@/adapters", () => ({
  AdapterFactory: {
    createFromEnv: vi.fn(() => mockAdapter),
  },
}));

import { dataService } from "./data.service";

describe("DataService Adapter Mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates createRecord to active adapter", async () => {
    mockAdapter.createRecord.mockResolvedValueOnce("rec-created-123");

    const recordId = await dataService.createRecord("KPIs", {
      "KPI Name": "Test KPI",
      targetValue: 100,
    });

    expect(mockAdapter.connect).toHaveBeenCalled();
    expect(mockAdapter.createRecord).toHaveBeenCalledWith("KPIs", {
      "KPI Name": "Test KPI",
      targetValue: 100,
    });
    expect(recordId).toBe("rec-created-123");
  });

  it("delegates updateRecord to active adapter", async () => {
    mockAdapter.updateRecord.mockResolvedValueOnce(true);

    const success = await dataService.updateRecord("KPIs", "rec-123", {
      status: "completed",
    });

    expect(mockAdapter.connect).toHaveBeenCalled();
    expect(mockAdapter.updateRecord).toHaveBeenCalledWith("KPIs", "rec-123", {
      status: "completed",
    });
    expect(success).toBe(true);
  });

  it("delegates deleteRecord to active adapter", async () => {
    mockAdapter.deleteRecord.mockResolvedValueOnce(true);

    const success = await dataService.deleteRecord("KPIs", "rec-123");

    expect(mockAdapter.connect).toHaveBeenCalled();
    expect(mockAdapter.deleteRecord).toHaveBeenCalledWith("KPIs", "rec-123");
    expect(success).toBe(true);
  });

  it("throws error when adapter mutation fails and does not fallback to Airtable", async () => {
    mockAdapter.createRecord.mockRejectedValueOnce(
      new Error("Write operations are not supported by the Google Sheets adapter (table: KPIs).")
    );

    await expect(
      dataService.createRecord("KPIs", { name: "Test" })
    ).rejects.toThrow(/Write operations are not supported/);
  });
});
