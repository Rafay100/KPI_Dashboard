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

interface DepartmentRankingChartProps {
  data: Array<{ name: string; score: number; kpis: number }>;
}

export const DepartmentRankingChart = memo(function DepartmentRankingChart({
  data,
}: DepartmentRankingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
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
        <Bar dataKey="score" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Average Score" />
        <Bar dataKey="kpis" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Total KPIs" />
      </BarChart>
    </ResponsiveContainer>
  );
});

