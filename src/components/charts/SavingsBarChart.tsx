"use client";

import { memo, useMemo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatCurrencyWithSymbol } from "@/lib/currency";

interface SavingsData {
  month: string;
  amount: number;
  percentage: number;
}

interface SavingsBarChartProps {
  data: SavingsData[];
}

function getBarColor(percentage: number): string {
  if (percentage >= 30) return "#10b981"; // Verde >= 30%
  if (percentage >= 20) return "#8b5cf6"; // Roxo >= 20%
  if (percentage >= 10) return "#f59e0b"; // Amarelo >= 10%
  return "#ef4444"; // Vermelho < 10%
}

function getMonthLabel(monthString: string): string {
  const [year, month] = monthString.split("-").map(Number);
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return monthNames[month - 1];
}

export const SavingsBarChart = memo(function SavingsBarChart({ data }: SavingsBarChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      monthLabel: getMonthLabel(item.month),
      fill: getBarColor(item.percentage),
    }));
  }, [data]);

  const averagePercentage = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.percentage, 0) / data.length;
  }, [data]);

  const currentPercentage = data.length > 0 ? data[data.length - 1].percentage : 0;
  const trend = currentPercentage - averagePercentage;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">
        Sem dados de poupança disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-on-surface-variant">Média (3 meses)</p>
          <p className="text-lg font-bold text-on-surface">{averagePercentage.toFixed(1)}%</p>
        </div>
        <div className={`flex items-center gap-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
          <span className="text-lg font-bold">
            {currentPercentage.toFixed(1)}%
          </span>
          <span className="text-xs">
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3449" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8899ac", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8899ac", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 50]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
              formatter={(value: number, name: string) => {
                if (name === "percentage") {
                  return [`${value.toFixed(1)}%`, "Poupança"];
                }
                if (name === "amount") {
                  return [formatCurrencyWithSymbol(value), "Valor"];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: "Meta 30%", fill: "#10b981", fontSize: 12, position: "right" }}
            />
            <Bar
              dataKey="percentage"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-container-highest">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <p className="text-xs text-on-surface-variant">{getMonthLabel(item.month)}</p>
            <p className={`text-sm font-bold ${getBarColor(item.percentage) === "#10b981" ? "text-green-500" : getBarColor(item.percentage) === "#8b5cf6" ? "text-primary" : getBarColor(item.percentage) === "#f59e0b" ? "text-amber-500" : "text-red-500"}`}>
              {item.percentage.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});
