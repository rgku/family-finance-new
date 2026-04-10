"use client";

import { useState, useMemo } from "react";

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface MonthNavigatorProps {
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  isMobile?: boolean;
}

export function MonthNavigator({ selectedMonth, onMonthChange, isMobile = false }: MonthNavigatorProps) {
  const now = new Date();
  const defaultMonth = selectedMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const [current, setCurrent] = useState(defaultMonth);
  
  const [year, month] = (selectedMonth || current).split("-").map(Number);
  const monthName = monthNames[month - 1];

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const handlePrev = () => {
    const newMonth = `${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`;
    setCurrent(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const newMonth = `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`;
    setCurrent(newMonth);
    onMonthChange?.(newMonth);
  };

  const containerClass = isMobile
    ? "fixed top-16 left-0 right-0 z-40 bg-surface border-b border-surface-container py-2"
    : "flex items-center justify-center gap-4 py-2 bg-surface-container rounded-lg";

  const buttonClass = isMobile
    ? "p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
    : "p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant";

  const buttonDisabledClass = isMobile ? "opacity-50" : "opacity-50";

  return (
    <div className={containerClass}>
      <button
        onClick={handlePrev}
        className={buttonClass}
        aria-label="Mês anterior"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <span className={isMobile ? "text-sm font-bold text-on-surface min-w-[120px] text-center" : "text-lg font-bold text-on-surface min-w-[160px] text-center"}>
        {monthName} {year}
      </span>
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className={`${buttonClass} ${!canGoNext ? buttonDisabledClass : ""}`}
        aria-label="Mês seguinte"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

export function getMonthInfo(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  return {
    year,
    month,
    monthName: monthNames[month - 1],
    key: `${year}-${String(month).padStart(2, "0")}`,
  };
}