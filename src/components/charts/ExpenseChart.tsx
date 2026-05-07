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
import { useDeviceType } from "@/hooks/useDeviceType";

interface ExpenseChartProps {
  data: { category: string; amount: number }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: "#1e293b",
        border: "none",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        padding: "12px 16px",
      }}>
        <p style={{ color: "#f8fafc", fontWeight: 600, margin: "0 0 8px 0" }}>
          {data.name}
        </p>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
          {Number(data.value).toFixed(2)} € ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const ExpenseChart = memo(function ExpenseChart({ data }: ExpenseChartProps) {
  const isMobile = useDeviceType();
  const totalExpenses = useMemo(() => data.reduce((sum, d) => sum + d.amount, 0), [data]);
  
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.amount > 0)
      .map((d, idx) => ({
        name: d.category,
        value: d.amount,
        fill: getCategoryColor(d.category, idx),
        percentage: totalExpenses > 0 ? ((d.amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, totalExpenses]);

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
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={800}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
});