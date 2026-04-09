"use client";

import { useState } from "react";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"month" | "year">("month");

  const demoData = {
    income: 5200,
    expenses: 2850,
    previousMonth: 3100,
  };

  const categoryBreakdown = [
    { name: "Alimentação", value: 850, color: "#4edea3" },
    { name: "Moradia", value: 1200, color: "#d0bcff" },
    { name: "Transporte", value: 320, color: "#ffb3ad" },
    { name: "Lazer", value: 280, color: "#4edea3" },
    { name: "Outros", value: 200, color: "#d0bcff" },
  ];

  const trendChange = ((demoData.expenses - demoData.previousMonth) / demoData.previousMonth * 100).toFixed(1);

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
          <p className="text-4xl font-bold mt-2">{formatCurrencyWithSymbol(demoData.income)}</p>
        </div>
        <div className="bg-surface-container p-8 rounded-lg">
          <p className="text-sm text-on-surface-variant">Despesas</p>
          <p className="text-4xl font-bold text-tertiary mt-2">{formatCurrencyWithSymbol(demoData.expenses)}</p>
        </div>
      </div>

      {/* Trend Comparison */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Comparativo Mensal</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Este mês</span>
            <span className="font-bold">{formatCurrencyWithSymbol(demoData.expenses)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Mês anterior</span>
            <span className="font-bold">{formatCurrencyWithSymbol(demoData.previousMonth)}</span>
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
                const offsets = [0, -40, -65, -80, -95];
                return (
                  <circle 
                    key={cat.name}
                    cx="18" 
                    cy="18" 
                    fill="transparent" 
                    r="15.915" 
                    stroke={cat.color}
                    strokeDasharray={`${(cat.value / demoData.expenses) * 100} ${100 - (cat.value / demoData.expenses) * 100}`}
                    strokeDashoffset={offsets[idx]}
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
              <span className="font-bold">{formatCurrencyWithSymbol(demoData.expenses)}</span>
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
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <div>
              <p className="font-medium">Gastos com Moradia</p>
              <p className="text-sm text-on-surface-variant">
                Este mês está no limite. Considere rever contratos de租赁.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-secondary/10 rounded-lg">
            <span className="material-symbols-outlined text-secondary">trending_down</span>
            <div>
              <p className="font-medium">Transporte</p>
              <p className="text-sm text-on-surface-variant">
                Este mês está 15% abaixo da média. Continue assim!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}