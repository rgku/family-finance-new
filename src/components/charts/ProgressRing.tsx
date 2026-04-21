"use client";

import { memo, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
  icon?: string;
  label?: string;
}

export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = "#6366f1",
  showPercentage = true,
  icon,
  label,
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-container"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              transformOrigin: "center",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <span style={{ color }}>
              <Icon name={icon || "folder"} size={24} className="text-2xl" />
            </span>
          )}
          {showPercentage && (
            <span className="text-xl font-bold" style={{ color }}>
              {Math.round(animatedProgress)}%
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs text-on-surface-variant text-center max-w-[100px] truncate">
          {label}
        </span>
      )}
    </div>
  );
});