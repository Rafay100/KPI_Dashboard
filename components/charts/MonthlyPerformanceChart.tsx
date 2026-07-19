"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { memo } from "react";

interface MonthlyPerformanceChartProps {
  data: Array<{ month: string; completed: number; pending: number; overdue: number }>;
}

export const MonthlyPerformanceChart = memo(function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend />
        <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed" />
        <Bar dataKey="pending" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Pending" />
        <Bar dataKey="overdue" fill="#EF4444" radius={[4, 4, 0, 0]} name="Overdue" />
      </BarChart>
    </ResponsiveContainer>
  );
});

