"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { memo } from "react";

interface AchievementDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"];

export const AchievementDistributionChart = memo(function AchievementDistributionChart({ data }: AchievementDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${entry.value}`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

