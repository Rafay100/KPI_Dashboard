"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { memo } from "react";

interface TaskStatusChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export const TaskStatusChart = memo(function TaskStatusChart({ data }: TaskStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label={(entry) => `${entry.name}: ${entry.value}`}
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

