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

  it("should not contain Approvals in the navigation items", () => {
    const allLabels = MENU_ITEMS.map((item) => item.label.toLowerCase());
    const allHrefs = MENU_ITEMS.map((item) => item.href.toLowerCase());
    expect(allLabels).not.toContain("approvals");
    expect(allHrefs).not.toContain("/approvals");
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

  it("should match the exact recommended client sidebar specification", () => {
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
          { label: "Tasks", href: "/tasks" },
          { label: "Kanban", href: "/kanban" },
          { label: "Calendar", href: "/task-calendar" },
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
          { label: "Import / Export", href: "/import-mapping" },
          { label: "Settings", href: "/settings" },
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
