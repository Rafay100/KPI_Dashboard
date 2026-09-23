import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBaseMock, getTableNameMock } = vi.hoisted(() => ({
  getBaseMock: vi.fn(),
  getTableNameMock: vi.fn(),
}));

vi.mock("@/services/airtable.client", () => ({
  default: {
    initialize: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(true),
    getBase: getBaseMock,
    getTableName: getTableNameMock,
  },
}));

import { AirtableAdapter } from "./AirtableAdapter";
import { DataSourceType } from "./types";

describe("AirtableAdapter Mutations", () => {
  let adapter: AirtableAdapter;

  beforeEach(() => {
    getBaseMock.mockReset();
    getTableNameMock.mockReset();
    adapter = new AirtableAdapter({ sourceType: DataSourceType.AIRTABLE });
  });

  it("creates a record resolving table name properly", async () => {
    const createMock = vi.fn().mockResolvedValue({ id: "rec-airtable-1" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("01_KPIs");

    const recordId = await adapter.createRecord("KPIs", {
      Name: "Test KPI",
    });

    expect(getTableNameMock).toHaveBeenCalledWith("kpis");
    expect(baseMock).toHaveBeenCalledWith("01_KPIs");
    expect(createMock).toHaveBeenCalled();
    expect(recordId).toBe("rec-airtable-1");
  });

  it("retries createRecord on unknown field error after sanitization", async () => {
    const createMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unknown field name: "Description"'))
      .mockResolvedValueOnce({ id: "rec-airtable-retry" });
    const baseMock = vi.fn().mockReturnValue({ create: createMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("KPIs");

    const recordId = await adapter.createRecord("KPIs", {
      "KPI Name": "Test KPI",
      Description: "Some desc",
      "Department ID": "dept-1",
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(recordId).toBe("rec-airtable-retry");
  });

  it("updates a record resolving table name properly", async () => {
    const updateMock = vi.fn().mockResolvedValue({ id: "rec-airtable-1" });
    const baseMock = vi.fn().mockReturnValue({ update: updateMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("01_KPIs");

    const success = await adapter.updateRecord("KPIs", "rec-airtable-1", {
      Status: "completed",
    });

    expect(getTableNameMock).toHaveBeenCalledWith("kpis");
    expect(baseMock).toHaveBeenCalledWith("01_KPIs");
    expect(updateMock).toHaveBeenCalledWith("rec-airtable-1", { Status: "completed" });
    expect(success).toBe(true);
  });

  it("deletes a record resolving table name properly", async () => {
    const destroyMock = vi.fn().mockResolvedValue({ id: "rec-airtable-1" });
    const baseMock = vi.fn().mockReturnValue({ destroy: destroyMock });

    getBaseMock.mockReturnValue(baseMock);
    getTableNameMock.mockResolvedValue("01_KPIs");

    const success = await adapter.deleteRecord("KPIs", "rec-airtable-1");

    expect(getTableNameMock).toHaveBeenCalledWith("kpis");
    expect(baseMock).toHaveBeenCalledWith("01_KPIs");
    expect(destroyMock).toHaveBeenCalledWith("rec-airtable-1");
    expect(success).toBe(true);
  });
});
