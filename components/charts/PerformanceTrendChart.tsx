"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { memo } from "react";

interface PerformanceTrendChartProps {
  data: Array<{ month: string; performance: number; target: number }>;
}

export const PerformanceTrendChart = memo(function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
        <Line
          type="monotone"
          dataKey="performance"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: "#3B82F6", r: 4 }}
          activeDot={{ r: 6 }}
          name="Performance"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: "#10B981", r: 4 }}
          name="Target"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

