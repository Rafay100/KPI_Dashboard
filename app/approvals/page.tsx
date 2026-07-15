"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useKPIs } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function ApprovalsPage() {
  const { data: kpis = [], isLoading } = useKPIs();

  const pendingUpdates = useMemo(() => {
    return kpis.filter((kpi) => kpi.status === "at-risk" || kpi.status === "overdue");
  }, [kpis]);

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Approval Queue"
          description="Review pending KPI updates and approve or reject them"
        />

        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4 text-sm text-slate-400">
            {isLoading ? "Loading pending approvals..." : `${pendingUpdates.length} pending items`}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-3">KPI</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUpdates.map((kpi) => (
                  <tr key={kpi.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{kpi.kpiName}</div>
                      <div className="text-xs text-slate-400">{kpi.description}</div>
                    </td>
                    <td className="px-4 py-4">{kpi.departmentId}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                        {kpi.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{new Date(kpi.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-500">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Revision
                        </Button>
                        <Button variant="outline" size="sm">
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
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
