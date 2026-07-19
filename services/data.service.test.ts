import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBaseMock, getTableNameMock } = vi.hoisted(() => ({
  getBaseMock: vi.fn(),
  getTableNameMock: vi.fn(),
}));

vi.mock("@/services/airtable.client", () => ({
  default: {
    getBase: getBaseMock,
    getTableName: getTableNameMock,
  },
}));

import { dataService } from "./data.service";

describe("DataService KPI creation", () => {
  beforeEach(() => {
    getBaseMock.mockReset();
    getTableNameMock.mockReset();
  });

  it("uses the resolved Airtable table name when creating a KPI", async () => {
    const createMock = vi.fn().mockResolvedValue({ id: "rec123" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("01_KPIs");

    const recordId = await dataService.createRecord("KPIs", {
      Name: "New KPI",
    });

    expect(getTableNameMock).toHaveBeenCalledWith("kpis");
    expect(baseMock).toHaveBeenCalledWith("01_KPIs");
    expect(createMock).toHaveBeenCalled();
    expect(recordId).toBe("rec123");
  }, 30000);

  it("removes unsupported Airtable fields and retries the create call", async () => {
    const createMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unknown field name: \"Description\""))
      .mockResolvedValueOnce({ id: "rec456" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("KPIs");

    const recordId = await dataService.createRecord("KPIs", {
      "KPI Name": "New KPI",
      Description: "A test KPI",
      "Department ID": "dept-1",
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ "KPI Name": "New KPI", Description: "A test KPI" })
    );
    expect(createMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({ "KPI Name": "New KPI", "Department ID": "dept-1" })
    );
    expect(recordId).toBe("rec456");
  }, 30000);
});
