import { beforeEach, describe, expect, it, vi } from "vitest";

const getBaseMock = vi.fn();
const getTableNameMock = vi.fn();

vi.mock("./airtable.client", () => ({
  default: {
    getBase: getBaseMock,
    getTableName: getTableNameMock,
  },
}));

describe("AirtableService KPI creation", () => {
  beforeEach(() => {
    vi.resetModules();
    getBaseMock.mockReset();
    getTableNameMock.mockReset();
  });

  it("uses the resolved Airtable table name when creating a KPI", async () => {
    const createMock = vi.fn().mockResolvedValue({ id: "rec123" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("01_KPIs");

    const { airtableService } = await import("./airtable.service");

    const recordId = await airtableService.createRecord("KPIs", {
      Name: "New KPI",
    });

    expect(getTableNameMock).toHaveBeenCalledWith("kpis");
    expect(baseMock).toHaveBeenCalledWith("01_KPIs");
    expect(createMock).toHaveBeenCalled();
    expect(recordId).toBe("rec123");
  });

  it("removes unsupported Airtable fields and retries the create call", async () => {
    const createMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unknown field name: \"Description\""))
      .mockResolvedValueOnce({ id: "rec456" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("KPIs");

    const { airtableService } = await import("./airtable.service");

    const recordId = await airtableService.createRecord("KPIs", {
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
  });
});
