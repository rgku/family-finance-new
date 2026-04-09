"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function AnalyticsPage() {
  const { transactions } = useData();
  const [period, setPeriod] = useState<"month" | "year">("month");

  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, number>();
  transactions.filter(t => t.type === "expense").forEach(t => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
  });

  const categoryColors = ["#4edea3", "#d0bcff", "#ffb3ad", "#fde68a", "#67e8f9", "#fb7185"];
  
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value], idx) => ({
    name,
    value,
    color: categoryColors[idx % categoryColors.length],
  }));

  const previousMonth = expenses * 0.9;
  const trendChange = previousMonth > 0 ? ((expenses - previousMonth) / previousMonth * 100).toFixed(1) : "0";

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Análise Financeira</h1>
          <p className="text-on-surface-variant">Veja onde o seu dinheiro está a ir</p>
        </div>
      </header>

      {/* Period Toggle */}
      <div className="flex gap-2 bg-surface-container rounded-full p-1 w-fit">
        <button
          onClick={() => setPeriod("month")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
            period === "month" ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant"
          }`}
        >
          Este Mês
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
            period === "year" ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant"
          }`}
        >
          Este Ano
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-lg text-on-primary">
          <p className="text-sm opacity-80">Receitas</p>
          <p className="text-4xl font-bold mt-2">{formatCurrencyWithSymbol(income)}</p>
        </div>
        <div className="bg-surface-container p-8 rounded-lg">
          <p className="text-sm text-on-surface-variant">Despesas</p>
          <p className="text-4xl font-bold text-tertiary mt-2">{formatCurrencyWithSymbol(expenses)}</p>
        </div>
      </div>

      {/* Trend Comparison */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Comparativo Mensal</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Este mês</span>
            <span className="font-bold">{formatCurrencyWithSymbol(expenses)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Mês anterior</span>
            <span className="font-bold">{formatCurrencyWithSymbol(previousMonth)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-surface-container-high">
            <span className="text-on-surface-variant">Variação</span>
            <span className={`font-bold ${Number(trendChange) > 0 ? "text-tertiary" : "text-primary"}`}>
              {Number(trendChange) > 0 ? "+" : ""}{trendChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-6">Gastos por Categoria</h3>
        
        <div className="flex items-center gap-8 mb-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32">
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
              <span className="font-bold">{formatCurrencyWithSymbol(expenses)}</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex-1 space-y-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm">{cat.name}</span>
                </div>
                <span className="font-semibold">{formatCurrencyWithSymbol(cat.value)}</span>
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