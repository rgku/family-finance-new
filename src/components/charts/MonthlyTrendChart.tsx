"use client";

import { memo } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDeviceType } from "@/hooks/useDeviceType";

interface MonthlyTrendChartProps {
  data: { month: string; income: number; expense: number; pouparanca: number }[];
}

export const MonthlyTrendChart = memo(function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const isMobile = useDeviceType();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        Sem dados para afficher
      </div>
    );
  }

  const height = isMobile ? 220 : 280;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pouparancaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          tickLine={false} 
          axisLine={false} 
          tick={{ fill: "#94a3b8", fontSize: 11 }} 
          tickFormatter={(value) => {
            const [year, month] = value.split("-");
            return `${month}/${year.slice(2)}`;
          }}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={{ fill: "#94a3b8", fontSize: 11 }} 
          tickFormatter={(value) => `${value}€`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
          formatter={(value) => `${Number(value).toFixed(2)} €`}
        />
        <Area 
          type="monotone" 
          dataKey="income" 
          stroke="#22c55e" 
          strokeWidth={2}
          fill="url(#incomeGradient)" 
          animationDuration={1000}
        />
        <Area 
          type="monotone" 
          dataKey="expense" 
          stroke="#f43f5e" 
          strokeWidth={2}
          fill="url(#expenseGradient)" 
          animationDuration={1000}
        />
        <Area 
          type="monotone" 
          dataKey="pouparanca" 
          stroke="#eab308" 
          strokeWidth={2}
          fill="url(#pouparancaGradient)" 
          animationDuration={1000}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
});