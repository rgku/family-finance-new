"use client";

import { memo, useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
  type PieLabelRenderProps,
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

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!percent || percent < 0.05) return null;
    const RAD = Math.PI / 180;
    const angle = midAngle ?? 0;
    const x = (cx ?? 0) + ((innerRadius ?? 0) + (outerRadius ?? 0) / 2) * Math.cos(-angle * RAD);
    const y = (cy ?? 0) + ((innerRadius ?? 0) + (outerRadius ?? 0) / 2) * Math.sin(-angle * RAD);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const basePieHeight = isMobile ? 280 : 320;
  const legendHeight = isMobile ? 80 : 80;
  
  const height = basePieHeight + legendHeight;
  const centerY = basePieHeight / 2;
  const chartInnerRadius = isMobile ? 45 : 55;
  const chartOuterRadius = isMobile ? 90 : 110;
  const showLabel = false;
  const showLegend = true;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy={centerY}
            innerRadius={chartInnerRadius}
            outerRadius={chartOuterRadius}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={showLabel ? renderCustomLabel : false}
            animationDuration={800}
          >
            <Label
              value={`Total\n${total.toFixed(0)}€`}
              position="center"
              fill="#dae2fd"
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textAnchor: 'middle',
              }}
            />
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

    </div>
  );
});