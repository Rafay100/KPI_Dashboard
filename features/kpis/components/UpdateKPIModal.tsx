"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { KPI } from "@/types/models";

interface UpdateKPIModalProps {
  kpi: KPI | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateKPIModal({ kpi, isOpen, onClose }: UpdateKPIModalProps) {
  const queryClient = useQueryClient();
  const [actualValue, setActualValue] = useState(kpi?.actualValue || 0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !kpi) return null;

  const newScore = Math.min(
    Math.round((actualValue / kpi.targetValue) * 100),
    100
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpi) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/kpis/${kpi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualValue,
          status: actualValue >= kpi.targetValue ? "completed" : kpi.status,
          kpiName: kpi.kpiName,
          description: kpi.description,
          targetValue: kpi.targetValue,
          dueDate: kpi.dueDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update KPI");
      }

      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update KPI");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#0a0e1a] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Update KPI</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">
              KPI Name
            </label>
            <p className="mt-1 text-white">{kpi.kpiName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">
              New Actual Value
            </label>
            <input
              type="number"
              value={actualValue}
              onChange={(e) => setActualValue(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add notes about this update..."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-blue-500/10 p-4">
            <div className="text-sm text-gray-400">Preview Score</div>
            <div className="mt-1 text-2xl font-bold text-white">{newScore}%</div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Update"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
