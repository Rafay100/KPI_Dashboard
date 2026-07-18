"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useKPIs } from "@/hooks/useData";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function ApprovalsPage() {
  const { data: kpis = [], isLoading, refetch } = useKPIs();
  const [toasts, setToasts] = useState<{ id: string; text: string; type: "success" | "error" }[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const addToast = (text: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleStatusChange = async (kpiId: string, newStatus: string) => {
    setProcessingId(kpiId);
    try {
      const response = await fetch(`/api/kpis/${kpiId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await response.json();
      if (resData.success) {
        addToast(`KPI status updated to "${newStatus}" successfully!`, "success");
        await refetch();
      } else {
        addToast(resData.message || "Failed to update KPI status", "error");
      }
    } catch (error) {
      addToast("Failed to update KPI status due to a network error", "error");
    } finally {
      setProcessingId(null);
    }
  };

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
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 capitalize">
                        {kpi.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">{new Date(kpi.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-500 text-white"
                          disabled={processingId === kpi.id}
                          onClick={() => handleStatusChange(kpi.id, "completed")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={processingId === kpi.id}
                          onClick={() => handleStatusChange(kpi.id, "in-progress")}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Revision
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={processingId === kpi.id}
                          onClick={() => handleStatusChange(kpi.id, "not-started")}
                          className="hover:bg-red-500/10 hover:text-red-400 border-white/10"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && pendingUpdates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No pending items in approvals queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Toast UI */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-3 shadow-lg border text-sm flex items-center space-x-2 ${
                t.type === "success" 
                  ? "bg-slate-900 border-green-500/30 text-green-400" 
                  : "bg-slate-900 border-red-500/30 text-red-400"
              }`}
            >
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
