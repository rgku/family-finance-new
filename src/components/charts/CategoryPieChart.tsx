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
  const legendHeight = isMobile ? 80 : 70;
  
  const height = basePieHeight + legendHeight;
  const chartInnerRadius = isMobile ? 20 : 30;
  const chartOuterRadius = isMobile ? 45 : 70;
  const showLabel = false;
  const showLegend = true;

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
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none"
          >
            <tspan
              x="50%"
              dy="-8"
              className="fill-on-surface-variant"
              fontSize="12"
              textAnchor="middle"
            >
              Total
            </tspan>
            <tspan
              x="50%"
              dy="18"
              className="fill-on-surface"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {total.toFixed(0)}€
            </tspan>
          </text>
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
    </div>
  );
});