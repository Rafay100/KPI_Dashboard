import type { MenuItem, NavSection } from "@/types";

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/",
      },
    ],
  },
  {
    title: "PERFORMANCE",
    items: [
      {
        id: "kpi-monitoring",
        label: "KPI Monitoring",
        href: "/kpi-monitoring",
      },
      {
        id: "employees",
        label: "Employees",
        href: "/employees",
      },
      {
        id: "departments",
        label: "Departments",
        href: "/departments",
      },
      {
        id: "rankings",
        label: "Rankings",
        href: "/rankings",
      },
    ],
  },
  {
    title: "WORK MANAGEMENT",
    items: [
      {
        id: "tasks",
        label: "Tasks",
        href: "/tasks",
      },
      {
        id: "kanban",
        label: "Kanban",
        href: "/kanban",
      },
      {
        id: "task-calendar",
        label: "Calendar",
        href: "/task-calendar",
      },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      {
        id: "kpi-analytics",
        label: "KPI Analytics",
        href: "/kpi-analytics",
      },
      {
        id: "employee-analytics",
        label: "Employee Analytics",
        href: "/employee-analytics",
      },
      {
        id: "department-analytics",
        label: "Department Analytics",
        href: "/department-analytics",
      },
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        id: "data-sources",
        label: "Data Sources",
        href: "/data-sources",
      },
      {
        id: "import-mapping",
        label: "Import / Export",
        href: "/import-mapping",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
      },
    ],
  },
];

// Flattened MENU_ITEMS array for any existing components referencing MENU_ITEMS
export const MENU_ITEMS: MenuItem[] = NAV_SECTIONS.flatMap((sec) => sec.items);
