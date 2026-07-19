"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "./StatusBadge";
import { ProgressCell } from "./ProgressCell";
import { UpdateKPIModal } from "./UpdateKPIModal";
import type { KPI } from "@/types/models";

interface KPIDetailDrawerProps {
  kpi: KPI | null;
  isOpen: boolean;
  onClose: () => void;
}

export function KPIDetailDrawer({ kpi, isOpen, onClose }: KPIDetailDrawerProps) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen || !kpi) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-[#0a0e1a] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0e1a] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{kpi.kpiName}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-400">Status</label>
            <div className="mt-2">
              <StatusBadge status={kpi.status} />
            </div>
          </div>

          {/* Description */}
          {kpi.description && (
            <div>
              <label className="text-sm font-medium text-gray-400">
                Description
              </label>
              <p className="mt-2 text-sm text-white">{kpi.description}</p>
            </div>
          )}

          {/* Progress */}
          <div>
            <label className="text-sm font-medium text-gray-400">Progress</label>
            <div className="mt-2">
              <ProgressCell
                actual={kpi.actualValue}
                target={kpi.targetValue}
                score={kpi.score}
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-400">
                Department
              </label>
              <p className="mt-1 text-sm text-white">{kpi.departmentId}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Employee
              </label>
              <p className="mt-1 text-sm text-white">{kpi.employeeId}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Target Value
              </label>
              <p className="mt-1 text-sm text-white">{kpi.targetValue}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Actual Value
              </label>
              <p className="mt-1 text-sm text-white">{kpi.actualValue}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Due Date
              </label>
              <p className="mt-1 text-sm text-white">
                {new Date(kpi.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Last Updated
              </label>
              <p className="mt-1 text-sm text-white">
                {new Date(kpi.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>

          {showHistory && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <div className="font-medium text-white">Recent activity</div>
              <ul className="mt-3 space-y-2">
                <li>Created: {new Date(kpi.createdAt).toLocaleString()}</li>
                <li>Last updated: {new Date(kpi.lastUpdated).toLocaleString()}</li>
                <li>Status: {kpi.status}</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 border-t border-white/10 pt-6">
            <Button className="flex-1" onClick={() => setIsUpdateOpen(true)}>
              Update KPI
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowHistory((value) => !value)}>
              {showHistory ? "Hide History" : "View History"}
            </Button>
          </div>
        </div>
      </div>

      <UpdateKPIModal
        kpi={kpi}
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
      />
    </>
  );
}

