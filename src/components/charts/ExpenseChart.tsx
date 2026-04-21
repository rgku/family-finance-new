"use client";

import { memo, useMemo, useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
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

  const height = isMobile ? 250 : 300;
  const marginLeft = isMobile ? 60 : 80;
  const yAxisWidth = isMobile ? 60 : 75;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={chartData} layout="vertical" margin={{ left: marginLeft }}>
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={yAxisWidth} />
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