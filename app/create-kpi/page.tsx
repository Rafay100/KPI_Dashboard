"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";

const createKPISchema = z.object({
  kpiName: z.string().min(1, "KPI name is required"),
  description: z.string().optional(),
  departmentId: z.string().min(1, "Department is required"),
  employeeId: z.string().min(1, "Employee is required"),
  targetValue: z.number().min(0, "Target value must be positive"),
  actualValue: z.number().min(0, "Actual value must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
});

type CreateKPIForm = z.infer<typeof createKPISchema>;

export default function CreateKPI() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateKPIForm>({
    resolver: zodResolver(createKPISchema),
    defaultValues: {
      actualValue: 0,
    },
  });

  const targetValue = watch("targetValue");
  const actualValue = watch("actualValue");

  const previewScore =
    targetValue && actualValue
      ? Math.min(Math.round((actualValue / targetValue) * 100), 100)
      : 0;

  const onSubmit = async (data: CreateKPIForm) => {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create KPI");
      }

      setMessage("KPI created successfully and queued for sync.");
      setTimeout(() => router.push("/kpi-tracking-board"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while creating KPI");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Create New KPI"
            description="Define a new KPI with targets and tracking parameters"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h3 className="mb-6 text-lg font-semibold text-white">
                  Basic Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      KPI Name *
                    </label>
                    <input
                      {...register("kpiName")}
                      type="text"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter KPI name"
                    />
                    {errors.kpiName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.kpiName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Describe the KPI..."
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Department *
                      </label>
                      <input
                        {...register("departmentId")}
                        type="text"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Department ID"
                      />
                      {errors.departmentId && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.departmentId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Employee *
                      </label>
                      <input
                        {...register("employeeId")}
                        type="text"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Employee ID"
                      />
                      {errors.employeeId && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.employeeId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="mb-6 text-lg font-semibold text-white">
                  Target & Values
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Target Value *
                    </label>
                    <input
                      {...register("targetValue", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                    {errors.targetValue && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.targetValue.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Actual Value
                    </label>
                    <input
                      {...register("actualValue", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Due Date *
                    </label>
                    <input
                      {...register("dueDate")}
                      type="date"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.dueDate && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.dueDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  Score Preview
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">
                    {previewScore}%
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Current Score
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${previewScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Target</span>
                    <span className="font-semibold text-white">
                      {targetValue || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Actual</span>
                    <span className="font-semibold text-white">
                      {actualValue || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Remaining</span>
                    <span className="font-semibold text-white">
                      {Math.max((targetValue || 0) - (actualValue || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create KPI
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </DashboardLayout>
  );
}
