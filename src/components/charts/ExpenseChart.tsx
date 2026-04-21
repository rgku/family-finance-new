"use client";

import { memo, useMemo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getCategoryColor } from "@/lib/categoryColors";

interface ExpenseChartProps {
  data: { category: string; amount: number }[];
}

export const ExpenseChart = memo(function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.amount > 0)
      .map((d, idx) => ({
        name: d.category,
        value: d.amount,
        fill: getCategoryColor(d.category, idx),
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        Sem dados para afficher
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={75} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
          formatter={(value) => [`${Number(value).toFixed(2)} €`, "Valor"]}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
});