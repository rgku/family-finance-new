"use client";

import { useState, useMemo } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function AnalyticsPage() {
  const { transactions } = useData();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = monthNames[month - 1];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getFullYear() === year && transDate.getMonth() === month - 1;
    });
  }, [transactions, year, month]);

  const income = useMemo(() => filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredTransactions.filter(t => t.type === "expense").forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });

    const categoryColors = ["#4edea3", "#d0bcff", "#ffb3ad", "#fde68a", "#67e8f9", "#fb7185"];
    
    return Array.from(categoryMap.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: categoryColors[idx % categoryColors.length],
    }));
  }, [filteredTransactions]);

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Análise Financeira</h1>
          <p className="text-on-surface-variant">Veja onde o seu dinheiro está a ir</p>
        </div>
      </header>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
          className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="text-xl font-bold text-on-surface min-w-[160px] text-center">
          {monthName} {year}
        </span>
        <button
          onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
          disabled={!canGoNext}
          className={`p-2 rounded-full bg-surface-container text-on-surface-variant ${canGoNext ? "hover:bg-surface-container-high cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary to-primary-container p-6 sm:p-8 rounded-lg text-on-primary min-w-0">
          <p className="text-sm opacity-80">Receitas</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 min-w-0 truncate">{formatCurrencyWithSymbol(income)}</p>
        </div>
        <div className="bg-surface-container p-6 sm:p-8 rounded-lg min-w-0">
          <p className="text-sm text-on-surface-variant">Despesas</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-tertiary mt-2 min-w-0 truncate">{formatCurrencyWithSymbol(expenses)}</p>
        </div>
      </div>

      {/* Trend Comparison */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Comparativo Mensal</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center min-w-0">
            <span className="text-on-surface-variant">{monthName}</span>
            <span className="font-bold min-w-0 truncate">{formatCurrencyWithSymbol(expenses)}</span>
          </div>
          <div className="flex justify-between items-center min-w-0">
            <span className="text-on-surface-variant">{monthNames[prevMonth.month - 1]}</span>
            <span className="font-bold min-w-0 truncate">{formatCurrencyWithSymbol(0)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-surface-container-high min-w-0">
            <span className="text-on-surface-variant">Variação</span>
            <span className="font-bold text-on-surface-variant">--</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-6">Gastos por Categoria</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#222a3d" strokeWidth="3"></circle>
              {categoryBreakdown.map((cat, idx) => {
                const total = categoryBreakdown.reduce((s, c) => s + c.value, 0);
                const offsets = [0, -40, -65, -80, -95];
                return (
                  <circle 
                    key={cat.name}
                    cx="18" 
                    cy="18" 
                    fill="transparent" 
                    r="15.915" 
                    stroke={cat.color}
                    strokeDasharray={`${total > 0 ? (cat.value / total) * 100 : 0} ${100 - (total > 0 ? (cat.value / total) * 100 : 0)}`}
                    strokeDashoffset={offsets[idx]}
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
              <span className="font-bold text-sm min-w-0 truncate">{formatCurrencyWithSymbol(expenses)}</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex-1 space-y-2 w-full min-w-0">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm truncate">{cat.name}</span>
                </div>
                <span className="font-semibold flex-shrink-0 ml-2">{formatCurrencyWithSymbol(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Dicas de Poupança</h3>
        <div className="space-y-3">
          {categoryBreakdown.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              <div>
                <p className="font-medium">Sem dados suficientes</p>
                <p className="text-sm text-on-surface-variant">
                  Adicione transações para ver recomendações personalizadas.
                </p>
              </div>
            </div>
          ) : (
            <>
              {categoryBreakdown.slice(0, 2).map((cat, idx) => (
                <div key={cat.name} className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary">{idx === 0 ? "lightbulb" : "trending_down"}</span>
                  <div>
                    <p className="font-medium">Gastos com {cat.name}</p>
                    <p className="text-sm text-on-surface-variant">
                      Este mês: {formatCurrencyWithSymbol(cat.value)} - Considere otimizar gastos nesta categoria.
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}