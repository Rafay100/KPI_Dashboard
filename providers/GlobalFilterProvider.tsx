"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface GlobalFilters {
  startDate: string | null;
  endDate: string | null;
  department: string | null;
  team: string | null;
  employee: string | null;
  kpiCategory: string | null;
  kpiStatus: string | null;
  kpiFrequency: string | null;
  taskStatus: string | null;
  performanceLevel: string | null;
  rankingType: string | null;
  entryMethod: string | null;
  approvalStatus: string | null;
  sourceSystem: string | null;
}

const defaultFilters: GlobalFilters = {
  startDate: null,
  endDate: null,
  department: null,
  team: null,
  employee: null,
  kpiCategory: null,
  kpiStatus: null,
  kpiFrequency: null,
  taskStatus: null,
  performanceLevel: null,
  rankingType: null,
  entryMethod: null,
  approvalStatus: null,
  sourceSystem: null,
};

interface GlobalFilterContextType {
  filters: GlobalFilters;
  setFilter: (key: keyof GlobalFilters, value: string | null) => void;
  clearFilter: (key: keyof GlobalFilters) => void;
  clearAllFilters: () => void;
  activeFiltersCount: number;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (open: boolean) => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Load from sessionStorage on client load
  useEffect(() => {
    const saved = sessionStorage.getItem("global_filters");
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

  const setFilter = (key: keyof GlobalFilters, value: string | null) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      sessionStorage.setItem("global_filters", JSON.stringify(next));
      return next;
    });
  };

  const clearFilter = (key: keyof GlobalFilters) => {
    setFilter(key, null);
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    sessionStorage.setItem("global_filters", JSON.stringify(defaultFilters));
  };

  const activeFiltersCount = Object.entries(filters).reduce((acc, [key, val]) => {
    // If startDate/endDate both set, count as 1 or count separately. Let's count non-null values.
    if (val !== null && val !== "") {
      return acc + 1;
    }
    return acc;
  }, 0);

  return (
    <GlobalFilterContext.Provider
      value={{
        filters,
        setFilter,
        clearFilter,
        clearAllFilters,
        activeFiltersCount,
        isFilterDrawerOpen,
        setIsFilterDrawerOpen,
      }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error("useGlobalFilters must be used within a GlobalFilterProvider");
  }
  return context;
}
