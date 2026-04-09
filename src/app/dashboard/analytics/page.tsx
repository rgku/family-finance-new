"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  month: string;
}

// Sample data for demo - will be replaced with real data
const sampleTransactions: Transaction[] = [
  { id: "1", description: "Salário", amount: 8400, type: "income", category: "Renda", date: "2024-09-01" },
  { id: "2", description: "Supermercado", amount: 450, type: "expense", category: "Alimentação", date: "2024-09-05" },
  { id: "3", description: "Aluguel", amount: 1500, type: "expense", category: "Moradia", date: "2024-09-10" },
  { id: "4", description: "Netflix", amount: 55, type: "expense", category: "Lazer", date: "2024-09-12" },
  { id: "5", description: "Uber", amount: 85, type: "expense", category: "Transporte", date: "2024-09-15" },
  { id: "6", description: "Farmácia", amount: 120, type: "expense", category: "Saúde", date: "2024-09-18" },
  { id: "7", description: "Restaurante", amount: 280, type: "expense", category: "Alimentação", date: "2024-09-20" },
];

export default function AnalyticsPage() {
  const { supabase, user } = useAuth();
  const [period, setPeriod] = useState<"month" | "year">("month");

  // Calculate totals
  const currentMonthTransactions = sampleTransactions.filter(t => 
    t.date.startsWith("2024-09")
  );
  
  const income = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown
  const categoryBreakdown = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categories = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / expenses) * 100),
  }));

  // Mock previous month data for comparison
  const previousMonthExpenses = expenses * 0.92;
  const trendChange = ((expenses - previousMonthExpenses) / previousMonthExpenses * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline font-bold text-lg text-on-surface">Análise</h1>
        <div className="w-10"></div>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-6">
        {/* Period Toggle */}
        <div className="flex gap-2 bg-surface-container rounded-full p-1">
          <button
            onClick={() => setPeriod("month")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              period === "month"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant"
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              period === "year"
                ? "bg-surface-container-highest text-on-surface"
                : "text-on-surface-variant"
            }`}
          >
            Este Ano
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-lg p-5">
            <p className="text-xs text-on-surface-variant font-medium">Receitas</p>
                <p className="font-headline text-2xl font-bold text-primary mt-1">
                {formatCurrencyWithSymbol(income)}
              </p>
            </div>
            <div className="bg-surface-container rounded-lg p-5">
              <p className="font-label text-xs text-on-surface-variant font-medium">Despesas</p>
              <p className="font-headline text-2xl font-bold text-tertiary mt-1">
                {formatCurrencyWithSymbol(expenses)}
              </p>
          </div>
          <div className="bg-surface-container rounded-lg p-5">
            <p className="text-xs text-on-surface-variant font-medium">Despesas</p>
            <p className="font-headline text-2xl font-bold text-tertiary mt-1">
              R$ {expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Trend Comparison */}
        <div className="bg-surface-container rounded-lg p-5">
          <h3 className="font-headline font-bold text-lg mb-4">Comparativo Mensal</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Este mês</span>
              <span className="font-bold">{formatCurrencyWithSymbol(expenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Mês anterior</span>
              <span className="font-bold">{formatCurrencyWithSymbol(previousMonthExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-surface-container-highest">
              <span className="text-on-surface-variant text-sm">Variação</span>
              <span className={`font-bold ${Number(trendChange) > 0 ? "text-tertiary" : "text-primary"}`}>
                {Number(trendChange) > 0 ? "+" : ""}{trendChange}%
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-surface-container rounded-lg p-5">
          <h3 className="font-headline font-bold text-lg mb-4">Por Categoria</h3>
          
          {/* Simple Donut Chart Representation */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#222a3d" strokeWidth="3"></circle>
                {categories.slice(0, 3).map((cat, idx) => {
                  const colors = ["#4edea3", "#d0bcff", "#ffb3ad"];
                  const offsets = [0, -40, -70];
                  return (
                    <circle 
                      key={cat.name}
                      cx="18" 
                      cy="18" 
                      fill="transparent" 
                      r="15.915" 
                      stroke={colors[idx]} 
                      strokeDasharray={`${cat.percentage} ${100 - cat.percentage}`}
                      strokeDashoffset={offsets[idx]}
                      strokeWidth="3"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
                  <span className="text-xs font-bold">{formatCurrencyWithSymbol(expenses)}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              {categories.map((cat, idx) => {
                const colors = ["bg-primary", "bg-secondary", "bg-tertiary"];
                return (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[idx]}`}></div>
                      <span className="text-on-surface-variant">{cat.name}</span>
                    </div>
                    <span className="font-semibold">{cat.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Details */}
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="font-bold text-tertiary">{formatCurrencyWithSymbol(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-surface-container rounded-lg p-5">
          <h3 className="font-headline font-bold text-lg mb-4">Dicas de Poupança</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              <div>
                <p className="text-sm font-medium">Gastos com Alimentação</p>
                <p className="text-xs text-on-surface-variant">
                  Este mês está 15% acima da média. Considere planejar as compras do mês.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary">trending_down</span>
              <div>
                <p className="text-sm font-medium">Transporte</p>
                <p className="text-xs text-on-surface-variant">
                  Este mês снижен 8% em relação ao mês anterior. Continue assim!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Home</span>
        </Link>
        <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Add</span>
        </Link>
        <Link href="/dashboard/goals" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">track_changes</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Metas</span>
        </Link>
      </nav>
    </div>
  );
}