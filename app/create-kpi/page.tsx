"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useKPIs, useEmployees, useDepartments } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Cpu,
  User,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info
} from "lucide-react";

// Form Zod Validation Schema
const createKPISchema = z.object({
  kpiName: z.string().min(1, "KPI name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  frequency: z.string().min(1, "Frequency is required"),
  departmentId: z.string().min(1, "Department is required"),
  team: z.string().optional(),
  employeeId: z.string().min(1, "Assigned employee is required"),
  owner: z.string().min(1, "KPI Owner/Manager is required"),
  targetValue: z.number().min(0.001, "Target value must be greater than zero"),
  actualValue: z.number().min(0, "Actual value must be positive"),
  unit: z.string().min(1, "Unit of measurement is required"),
  dueDate: z.string().min(1, "Due date is required"),
  code: z.string().min(1, "KPI Code is required"),
  status: z.enum(["not-started", "in-progress", "at-risk", "completed", "overdue"]),
});

type CreateKPIForm = z.infer<typeof createKPISchema>;

export default function CreateKPI() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load live tables to populate selectors dynamically
  const { data: kpis = [] } = useKPIs();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateKPIForm>({
    resolver: zodResolver(createKPISchema),
    defaultValues: {
      kpiName: "",
      description: "",
      category: "Marketing",
      frequency: "Monthly",
      departmentId: "",
      team: "",
      employeeId: "",
      owner: "",
      targetValue: 0,
      actualValue: 0,
      unit: "Percentage",
      dueDate: "",
      code: "",
      status: "not-started",
    },
  });

  // Watch fields for previews
  const kpiName = watch("kpiName");
  const category = watch("category");
  const targetValue = watch("targetValue");
  const actualValue = watch("actualValue");
  const unit = watch("unit");
  const code = watch("code");

  const previewScore = useMemo(() => {
    if (!targetValue || !actualValue) return 0;
    return Math.min(Math.round((actualValue / targetValue) * 100), 100);
  }, [targetValue, actualValue]);

  // Auto-generate unique KPI Code based on existing records
  useEffect(() => {
    if (kpis.length > 0 && !watch("code")) {
      let maxNum = kpis.length;
      kpis.forEach((k) => {
        if (k.code && k.code.startsWith("KPI-")) {
          const num = parseInt(k.code.substring(4));
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const nextCode = `KPI-${String(maxNum + 1).padStart(3, "0")}`;
      setValue("code", nextCode);
    }
  }, [kpis, setValue, watch]);

  // Dynamic values list derived from Airtable data
  const categoriesList = ["Marketing", "Sales", "Engineering", "HR", "Finance", "Product", "Support"];
  const frequenciesList = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];
  const unitsList = ["Percentage", "USD ($)", "Seconds", "Tasks", "Users", "Visitors", "Invoices"];

  // Unique Teams from employee records
  const teamsList = useMemo(() => {
    const teams = employees.map((emp) => emp.team).filter(Boolean);
    return Array.from(new Set(teams)).sort();
  }, [employees]);

  // Handle step navigation with validation checks
  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["kpiName", "description", "category", "frequency"]);
    } else if (step === 2) {
      isValid = await trigger(["departmentId", "team", "employeeId", "owner"]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
      setError("");
    } else {
      setError("Please fill out all required fields with valid entries before proceeding.");
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setError("");
  };

  // Submit Handler
  const onSubmit = async (data: CreateKPIForm) => {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      // Determine status automatically if score is 100%
      const finalStatus = previewScore >= 100 ? "completed" : data.status;

      const payload = {
        ...data,
        status: finalStatus,
      };

      const response = await fetch("/api/kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create KPI in Airtable");
      }

      setMessage("🎉 Success! KPI created and synced to Airtable.");
      
      // Invalidate cache immediately to refresh the table
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      setTimeout(() => router.push("/tracking-boards"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected connection error while creating KPI");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        {/* Navigation Header */}
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <PageHeader
              title="Create New KPI"
              description="Define a new operational metric with target scorecards"
            />
          </div>
        </div>

        {/* Multi-step Progress Indicator */}
        <div className="glass-card p-4 mb-6 border border-white/10 bg-white/2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
            {[
              { num: 1, label: "Basic Details" },
              { num: 2, label: "Allocation & Teams" },
              { num: 3, label: "Thresholds & Code" },
            ].map((s) => (
              <div key={s.num} className="flex items-center space-x-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all border ${
                    step === s.num
                      ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20"
                      : step > s.num
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border-white/10 text-gray-500"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    step === s.num ? "text-blue-400" : step > s.num ? "text-emerald-400" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 3 && <ChevronRight className="h-4 w-4 text-gray-700 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Compound Grid Layout: Form vs Preview */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Multi-step Form Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: Basic details */}
              {step === 1 && (
                <div className="glass-card p-6 border border-white/10 animate-in fade-in duration-200">
                  <h3 className="mb-4 text-base font-bold text-white flex items-center">
                    <Info className="mr-2 h-4 w-4 text-blue-400" /> Basic Details
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Enter the name, descriptive goal, category, and review frequency of the metric.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                        KPI Name *
                      </label>
                      <input
                        {...register("kpiName")}
                        type="text"
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Website Load Optimization"
                      />
                      {errors.kpiName && (
                        <p className="mt-1 text-xs text-red-400">{errors.kpiName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                        Description / Goal
                      </label>
                      <textarea
                        {...register("description")}
                        rows={4}
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Improve load latency, optimize index cache assets..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Category *
                        </label>
                        <select
                          {...register("category")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Tracking Frequency *
                        </label>
                        <select
                          {...register("frequency")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {frequenciesList.map((freq) => (
                            <option key={freq} value={freq}>
                              {freq}
                            </option>
                          ))}
                        </select>
                        {errors.frequency && (
                          <p className="mt-1 text-xs text-red-400">{errors.frequency.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Ownership & Allocation */}
              {step === 2 && (
                <div className="glass-card p-6 border border-white/10 animate-in fade-in duration-200">
                  <h3 className="mb-4 text-base font-bold text-white flex items-center">
                    <Users className="mr-2 h-4 w-4 text-blue-400" /> Ownership & Allocation
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Assign this KPI to an employee, mapping their department, team, and supervising owner.
                  </p>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Department Select */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Department *
                        </label>
                        <select
                          {...register("departmentId")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.departmentName}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                        {errors.departmentId && (
                          <p className="mt-1 text-xs text-red-400">{errors.departmentId.message}</p>
                        )}
                      </div>

                      {/* Team Select */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Team
                        </label>
                        <select
                          {...register("team")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Team (Optional)</option>
                          {teamsList.map((teamName) => (
                            <option key={teamName} value={teamName}>
                              {teamName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assigned Employee Select */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Assigned Employee *
                        </label>
                        <select
                          {...register("employeeId")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Employee</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.name}>
                              {emp.name} ({emp.position || "Staff"})
                            </option>
                          ))}
                        </select>
                        {errors.employeeId && (
                          <p className="mt-1 text-xs text-red-400">{errors.employeeId.message}</p>
                        )}
                      </div>

                      {/* Manager Owner Select */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          KPI Owner (Manager) *
                        </label>
                        <select
                          {...register("owner")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Manager</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.name}>
                              {emp.name} ({emp.position || "Staff"})
                            </option>
                          ))}
                        </select>
                        {errors.owner && (
                          <p className="mt-1 text-xs text-red-400">{errors.owner.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Thresholds, Units & Code */}
              {step === 3 && (
                <div className="glass-card p-6 border border-white/10 animate-in fade-in duration-200">
                  <h3 className="mb-4 text-base font-bold text-white flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-blue-400" /> Thresholds & Scheduling
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Define operational targets, initial progress metrics, unit mapping, and auto-generated ID.
                  </p>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Target Value */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Target Value *
                        </label>
                        <input
                          {...register("targetValue", { valueAsNumber: true })}
                          type="number"
                          step="0.001"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="e.g. 100"
                        />
                        {errors.targetValue && (
                          <p className="mt-1 text-xs text-red-400">{errors.targetValue.message}</p>
                        )}
                      </div>

                      {/* Actual Value */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Actual Value (Baseline)
                        </label>
                        <input
                          {...register("actualValue", { valueAsNumber: true })}
                          type="number"
                          step="0.001"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          placeholder="e.g. 0"
                        />
                        {errors.actualValue && (
                          <p className="mt-1 text-xs text-red-400">{errors.actualValue.message}</p>
                        )}
                      </div>

                      {/* Measurement Unit */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Measurement Unit *
                        </label>
                        <select
                          {...register("unit")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {unitsList.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                        {errors.unit && (
                          <p className="mt-1 text-xs text-red-400">{errors.unit.message}</p>
                        )}
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center">
                          <Calendar className="mr-1 h-3.5 w-3.5" /> Due Date *
                        </label>
                        <input
                          {...register("dueDate")}
                          type="date"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 color-scheme-dark"
                        />
                        {errors.dueDate && (
                          <p className="mt-1 text-xs text-red-400">{errors.dueDate.message}</p>
                        )}
                      </div>

                      {/* Auto-Generated KPI Code */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          KPI Code (Unique ID) *
                        </label>
                        <input
                          {...register("code")}
                          type="text"
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-blue-400 font-mono font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {errors.code && (
                          <p className="mt-1 text-xs text-red-400">{errors.code.message}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                          Initial Status
                        </label>
                        <select
                          {...register("status")}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0e1a] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="at-risk">At Risk</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Preview Component (Consistent styling) */}
            <div className="space-y-6">
              {/* Score & Progress Gauge Card */}
              <div className="glass-card p-6 border border-white/10">
                <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Target Score Preview
                </h3>
                <div className="text-center py-4">
                  <div className="text-5xl font-extrabold text-white tracking-tight">
                    {previewScore}%
                  </div>
                  <div className="mt-2 text-xs font-medium text-gray-400">
                    Estimated Progress Score
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${previewScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary Stats Ledger Card */}
              <div className="glass-card p-6 border border-white/10">
                <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  KPI Preview Ledger
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">KPI Code:</span>
                    <span className="font-semibold text-blue-400 font-mono">{code || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KPI Name:</span>
                    <span className="font-semibold text-white max-w-[140px] truncate text-right">{kpiName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="font-semibold text-gray-300">{category || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Value:</span>
                    <span className="font-semibold text-white">
                      {targetValue ? targetValue.toLocaleString() : 0} {unit || ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actual (Start):</span>
                    <span className="font-semibold text-white">
                      {actualValue ? actualValue.toLocaleString() : 0} {unit || ""}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/5 font-bold">
                    <span className="text-gray-400">Remaining Target:</span>
                    <span className="text-blue-400">
                      {Math.max((targetValue || 0) - (actualValue || 0), 0).toLocaleString()} {unit || ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast / Notification Banners */}
          {message && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 text-sm text-emerald-400 flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{message}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm text-red-400 flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Form Actions (Step controlled) */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/tracking-boards")}
              disabled={isSubmitting}
              className="border-white/10 hover:bg-white/5 text-gray-300 font-medium cursor-pointer"
            >
              Cancel
            </Button>

            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="border-white/10 hover:bg-white/5 text-white font-medium cursor-pointer"
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
              >
                Next <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center space-x-2 px-6 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving to Airtable...</span>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    <span>Create KPI Metric</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </PageContainer>
    </DashboardLayout>
  );
}

