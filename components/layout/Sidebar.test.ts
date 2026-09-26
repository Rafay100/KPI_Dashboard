import { describe, it, expect } from "vitest";
import { NAV_SECTIONS, MENU_ITEMS } from "@/constants/menu";

describe("Client Sidebar Navigation Structure", () => {
  it("should have exactly the 5 client-facing sections", () => {
    const sectionTitles = NAV_SECTIONS.map((s) => s.title);
    expect(sectionTitles).toEqual([
      "OVERVIEW",
      "PERFORMANCE",
      "WORK MANAGEMENT",
      "ANALYTICS",
      "ADMINISTRATION",
    ]);
  });

  it("should not contain removed items (Kanban, Calendar, Import / Export, Settings, Approvals) in navigation", () => {
    const allLabels = MENU_ITEMS.map((item) => item.label.toLowerCase());
    const allHrefs = MENU_ITEMS.map((item) => item.href.toLowerCase());
    expect(allLabels).not.toContain("approvals");
    expect(allHrefs).not.toContain("/approvals");
    expect(allLabels).not.toContain("kanban");
    expect(allHrefs).not.toContain("/kanban");
    expect(allLabels).not.toContain("calendar");
    expect(allHrefs).not.toContain("/task-calendar");
    expect(allLabels).not.toContain("import / export");
    expect(allHrefs).not.toContain("/import-mapping");
    expect(allLabels).not.toContain("settings");
    expect(allHrefs).not.toContain("/settings");
  });

  it("should have KPI Monitoring as the main KPI navigation item under PERFORMANCE", () => {
    const perfSection = NAV_SECTIONS.find((s) => s.title === "PERFORMANCE");
    expect(perfSection).toBeDefined();
    const firstItem = perfSection?.items[0];
    expect(firstItem?.label).toBe("KPI Monitoring");
    expect(firstItem?.href).toBe("/kpi-monitoring");
  });

  it("should have distinct, non-duplicate item IDs and hrefs", () => {
    const ids = MENU_ITEMS.map((item) => item.id);
    const hrefs = MENU_ITEMS.map((item) => item.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("should match the exact clean client sidebar specification", () => {
    const expected = [
      {
        title: "OVERVIEW",
        items: [{ label: "Dashboard", href: "/" }],
      },
      {
        title: "PERFORMANCE",
        items: [
          { label: "KPI Monitoring", href: "/kpi-monitoring" },
          { label: "Employees", href: "/employees" },
          { label: "Departments", href: "/departments" },
          { label: "Rankings", href: "/rankings" },
        ],
      },
      {
        title: "WORK MANAGEMENT",
        items: [
          { label: "Execution", href: "/tasks" },
          { label: "To-Dos", href: "/todos" },
          { label: "Issues / IDS", href: "/issues-ids" },
          { label: "Rocks / Quarterly Goals", href: "/rocks" },
          { label: "L10 Meetings", href: "/l10-meetings" },
        ],
      },
      {
        title: "ANALYTICS",
        items: [
          { label: "KPI Analytics", href: "/kpi-analytics" },
          { label: "Employee Analytics", href: "/employee-analytics" },
          { label: "Department Analytics", href: "/department-analytics" },
          { label: "Reports", href: "/reports" },
        ],
      },
      {
        title: "ADMINISTRATION",
        items: [
          { label: "Data Sources", href: "/data-sources" },
        ],
      },
    ];

    NAV_SECTIONS.forEach((section, idx) => {
      expect(section.title).toBe(expected[idx].title);
      expect(section.items.map((i) => ({ label: i.label, href: i.href }))).toEqual(
        expected[idx].items
      );
    });
  });
});
