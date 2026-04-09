"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";

export default function Dashboard() {
  const { user, signOut, supabase, loading } = useAuth();
  const { transactions, goals: dataGoals } = useData();
  const [isMobile, setIsMobile] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = monthNames[month - 1];

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getFullYear() === year && transDate.getMonth() === month - 1;
    });
  }, [transactions, year, month]);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = { total: totalIncome - totalExpenses, income: totalIncome, expenses: totalExpenses };
  const goals = dataGoals;

  const monthChange = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(0) : "0";
  const isPositive = balance.total >= 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop Sidebar - only show on desktop */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col h-screen w-64 border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
          <div className="p-8">
            <h1 className="text-xl font-bold tracking-tighter text-emerald-400">Fiscal Sanctuary</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Family Wealth</p>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-emerald-400 font-bold border-r-2 border-emerald-400 bg-emerald-400/5">
              <span className="material-symbols-outlined">home</span>
              <span>Home</span>
            </Link>
            <Link href="/dashboard/transactions" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span>Transações</span>
            </Link>
            <Link href="/dashboard/goals" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50">
              <span className="material-symbols-outlined">track_changes</span>
              <span>Metas</span>
            </Link>
            <Link href="/dashboard/budgets" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50">
              <span className="material-symbols-outlined">pie_chart</span>
              <span>Orçamentos</span>
            </Link>
            <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50">
              <span className="material-symbols-outlined">trending_up</span>
              <span>Análise</span>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50">
              <span className="material-symbols-outlined">settings</span>
              <span>Definições</span>
            </Link>
          </nav>
          <div className="p-4">
            <button onClick={signOut} className="w-full py-3 bg-surface-container text-on-surface rounded-lg text-sm font-medium hover:bg-surface-variant">
              Sair
            </button>
          </div>
        </aside>
      )}

      {isMobile ? (
        <>
          <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container text-primary">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </header>

          {/* Month Navigation */}
          <div className="fixed top-16 left-0 right-0 z-40 bg-surface border-b border-surface-container py-2">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-on-surface min-w-[120px] text-center">
                {monthName} {year}
              </span>
              <button
                onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
                disabled={!canGoNext}
                className={`p-1 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container" : "opacity-50"}`}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8 pb-32">
            {/* Floating Add Button */}
            <Link 
              href="/dashboard/transaction/new"
              className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </Link>

            <section className={`relative overflow-hidden rounded-lg p-8 shadow-2xl ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="font-label text-sm font-medium opacity-80 mb-1">Saldo Atual</p>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{isPositive ? "trending_up" : "trending_down"}</span>
                <span>{isPositive ? `+${monthChange}% este mês` : "Despesas superiores"}</span>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-lg p-5">
                <p className="font-label text-xs text-on-surface-variant">Receitas</p>
                <p className="font-headline text-xl font-bold text-primary">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container rounded-lg p-5">
                <p className="font-label text-xs text-on-surface-variant">Despesas</p>
                <p className="font-headline text-xl font-bold text-tertiary">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="font-headline text-xl font-bold text-on-surface">Metas</h3>
              {goals.map(goal => (
                <div key={goal.id} className="bg-surface-container-low rounded-lg p-6">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">{goal.icon}</span>
                      <span className="font-semibold">{goal.name}</span>
                    </div>
                    <span className="font-bold text-secondary">{Math.round(goal.current_amount / goal.target_amount * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-on-secondary-container" style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <h3 className="font-headline text-xl font-bold text-on-surface">Transações</h3>
              {filteredTransactions.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem transações neste mês</p>
              ) : (
                filteredTransactions.map(trans => (
                  <div key={trans.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined">{trans.type === "income" ? "payments" : "shopping_bag"}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{trans.description}</p>
                        <p className="text-xs text-on-surface-variant">{trans.category}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                      {trans.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(trans.amount)}
                    </p>
                  </div>
                ))
              )}
            </section>
          </main>

          <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
            <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <span className="material-symbols-outlined" style={pathname === "/dashboard" ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
              <span className="font-inter font-medium text-[9px] mt-1">Home</span>
            </Link>
            <Link href="/dashboard/transactions" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="font-inter font-medium text-[9px] mt-1">Trans</span>
            </Link>
            <div className="w-12"></div>
            <Link href="/dashboard/goals" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <span className="material-symbols-outlined">track_changes</span>
              <span className="font-inter font-medium text-[9px] mt-1">Metas</span>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-inter font-medium text-[9px] mt-1">Def</span>
            </Link>
          </nav>
        </>
      ) : (
        <main className="ml-64 p-8 space-y-8">
          <header className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-on-surface">Dashboard</h1>
              <p className="text-on-surface-variant">Bem-vindo de volta</p>
            </div>
            <Link href="/dashboard/transaction/new" className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold">
              + Nova Transação
            </Link>
          </header>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 py-2 bg-surface-container rounded-lg">
            <button
              onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-lg font-bold text-on-surface min-w-[160px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
              disabled={!canGoNext}
              className={`p-2 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container-high" : "opacity-50"}`}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className={`col-span-2 p-8 rounded-lg ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="text-sm opacity-80">Saldo Total</p>
              <h2 className="text-5xl font-bold mt-2">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-6 flex gap-4">
                <span className="bg-white/10 px-4 py-2 rounded-full text-sm">{isPositive ? `+${monthChange}% este mês` : "Despesas superiores"}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-container p-5 rounded-lg">
                <p className="text-xs text-on-surface-variant">Receitas</p>
                <p className="text-2xl font-bold text-primary">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container p-5 rounded-lg">
                <p className="text-xs text-on-surface-variant">Despesas</p>
                <p className="text-2xl font-bold text-tertiary">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-container p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Metas</h3>
              {goals.map(goal => (
                <div key={goal.id} className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span>{goal.name}</span>
                    <span className="text-secondary">{Math.round(goal.current_amount / goal.target_amount * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest rounded-full">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-surface-container p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Transações Recentes</h3>
              {filteredTransactions.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem transações neste mês</p>
              ) : (
                filteredTransactions.slice(0, 5).map(trans => (
                  <div key={trans.id} className="flex justify-between py-3 border-b border-surface-container-highest">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">{trans.type === "income" ? "payments" : "shopping_bag"}</span>
                      <div>
                        <p className="font-medium">{trans.description}</p>
                        <p className="text-xs text-on-surface-variant">{trans.category}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                      {trans.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(trans.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}