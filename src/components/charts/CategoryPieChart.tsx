"use client";

import { memo, useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCategoryColor } from "@/lib/categoryColors";
import { useDeviceType } from "@/hooks/useDeviceType";

interface CategoryPieChartProps {
  data: { category: string; amount: number }[];
}

export const CategoryPieChart = memo(function CategoryPieChart({ data }: CategoryPieChartProps) {
  const isMobile = useDeviceType();
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.amount > 0)
      .map((d, idx) => ({
        name: d.category,
        value: d.amount,
        color: getCategoryColor(d.category, idx),
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        Sem dados para afficher
      </div>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RAD = Math.PI / 180;
    const x = cx + (innerRadius + outerRadius / 2) * Math.cos(-midAngle * RAD);
    const y = cy + (innerRadius + outerRadius / 2) * Math.sin(-midAngle * RAD);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const basePieHeight = isMobile ? 180 : 220;
  const legendHeight = isMobile ? 80 : 70; // Always show legend on mobile with enough space
  
  const height = basePieHeight + legendHeight;
  const chartInnerRadius = isMobile ? 20 : 30; // Smaller pie on mobile to make room
  const chartOuterRadius = isMobile ? 45 : 70; // Smaller pie on mobile to make room
  const showLabel = false; // Never show labels on mobile to avoid overlap
  const showLegend = true; // Always show legend on mobile

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={chartInnerRadius}
            outerRadius={chartOuterRadius}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={showLabel ? renderCustomLabel : false}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={legendHeight}
              formatter={(value) => <span className="text-xs text-on-surface-variant">{value}</span>}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="text-xs text-on-surface-variant">Total</div>
        <div className="text-base font-bold text-on-surface">{total.toFixed(0)}€</div>
      </div>
    </div>
  );
});