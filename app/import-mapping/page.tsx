"use client";

import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus, Sparkles } from "lucide-react";

const mappings = [
  {
    sourceField: "Revenue",
    targetField: "Actual Value",
    transformationRule: "Numeric conversion",
    required: true,
    active: true,
  },
  {
    sourceField: "Due Date",
    targetField: "Due Date",
    transformationRule: "Normalize to ISO",
    required: true,
    active: true,
  },
  {
    sourceField: "Owner",
    targetField: "Employee",
    transformationRule: "Map by email",
    required: false,
    active: false,
  },
];

export default function ImportMappingPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title="Import Mapping"
            description="Define how external source fields map to KPI dashboard fields"
          />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center text-sm text-slate-400">
              <Sparkles className="mr-2 h-4 w-4 text-blue-400" />
              UI-only workflow for upcoming integrations.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-3">Source Field</th>
                  <th className="px-4 py-3">Target Field</th>
                  <th className="px-4 py-3">Transformation Rule</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.sourceField} className="border-b border-white/5 text-slate-300">
                    <td className="px-4 py-4 font-medium text-white">{mapping.sourceField}</td>
                    <td className="px-4 py-4">{mapping.targetField}</td>
                    <td className="px-4 py-4">{mapping.transformationRule}</td>
                    <td className="px-4 py-4">{mapping.required ? "Yes" : "No"}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${mapping.active ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {mapping.active ? "Active" : "Paused"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
