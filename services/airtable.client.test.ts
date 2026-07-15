import { beforeEach, describe, expect, it, vi } from "vitest";

const baseMock = vi.fn();

vi.mock("airtable", () => ({
  default: {
    configure: vi.fn(),
    base: baseMock,
  },
}));

describe("Airtable client table lookup", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AIRTABLE_API_KEY = "test-key";
    process.env.AIRTABLE_BASE_ID = "app-test";
    process.env.AIRTABLE_KPI_TABLE = "KPIs";
    baseMock.mockReset();
  });

  it("falls back to an alternate table name if the configured table is unavailable", async () => {
    baseMock.mockImplementation(() => {
      return (tableName: string) => ({
        select: () => ({
          firstPage: async () => {
            if (tableName === "KPIs") {
              throw new Error("not found");
            }

            return [{ id: "rec1" }];
          },
        }),
      });
    });

    const airtableClient = (await import("./airtable.client")).default;
    const tableName = await airtableClient.getTableName("kpis");

    expect(tableName).toBe("01_KPIs");
  });
});
