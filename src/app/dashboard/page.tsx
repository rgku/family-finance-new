"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { isDateInCustomMonth, formatCustomMonth, getCustomMonthRange } from "@/lib/dateUtils";
import Link from "next/link";

import { DesktopSidebar, MobileHeader, MobileNav } from "@/components/Sidebar";

export default function Dashboard() {
  const { user, signOut, supabase, loading, profile } = useAuth();
  const { transactions, goals: dataGoals } = useData();
  const isMobile = useDeviceType();
  
  const billingDay = profile?.billing_cycle_day || 1;
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    if (billingDay > 1) {
      const { startDate } = getCustomMonthRange(billingDay, now);
      return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);
  
  const monthName = profile?.billing_cycle_day && profile.billing_cycle_day > 1
    ? formatCustomMonth(billingDay, new Date(year, month - 1, 25))
    : monthNames[month - 1];

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
      return transactions.filter(t => isDateInCustomMonth(t.date, billingDay, year, month));
    }
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getFullYear() === year && transDate.getMonth() === month - 1;
    });
  }, [transactions, year, month, profile?.billing_cycle_day, billingDay]);

  const { totalIncome, totalExpenses, balance, savingsGoals, expenseGoals } = useMemo(() => {
    const inc = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const exp = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    
    const savings = dataGoals.filter(g => g.goal_type === 'savings');
    const expenses = dataGoals.filter(g => g.goal_type === 'expense');
    
    const savingsAllocated = savings.reduce((sum, g) => sum + g.current_amount, 0);
    
    return { 
      totalIncome: inc, 
      totalExpenses: exp, 
      balance: { total: inc - exp - savingsAllocated, income: inc, expenses: exp },
      savingsGoals: savings,
      expenseGoals: expenses
    };
  }, [filteredTransactions, dataGoals]);

  const monthChange = useMemo(() => {
    return totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(0) : "0";
  }, [totalIncome, totalExpenses]);
  
  const isPositive = balance.total >= 0;

  return (
    <div className="min-h-screen bg-surface">
      {!isMobile && <DesktopSidebar onSignOut={signOut} />}

      {isMobile ? (
        <>
          <MobileHeader onSignOut={signOut} />

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
            <section className={`mt-4 relative overflow-hidden rounded-lg p-8 shadow-2xl ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="font-label text-sm font-medium opacity-80 mb-1">Saldo Atual</p>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight min-w-0 truncate">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{isPositive ? "trending_up" : "trending_down"}</span>
                <span>{isPositive ? `+${monthChange}% este mês` : "Despesas superiores"}</span>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-lg p-5 min-w-0">
                <p className="font-label text-xs text-on-surface-variant">Receitas</p>
                <p className="font-headline text-xl font-bold text-primary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container rounded-lg p-5 min-w-0">
                <p className="font-label text-xs text-on-surface-variant">Despesas</p>
                <p className="font-headline text-xl font-bold text-tertiary min-w-0 truncate">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="font-headline text-xl font-bold text-on-surface">Metas de Poupança</h3>
              {savingsGoals.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem metas de poupança</p>
              ) : (
                savingsGoals.map(goal => (
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
                ))
              )}
            </section>

            <Link href="/dashboard/budgets" className="block bg-surface-container rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">pie_chart</span>
                <span className="font-semibold">Orçamentos</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </Link>
          </main>

          <MobileNav />
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
            <div className={`col-span-2 p-8 rounded-lg min-w-0 ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="text-sm opacity-80">Saldo Total</p>
              <h2 className="text-4xl sm:text-5xl font-bold mt-2 min-w-0 truncate">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-6 flex gap-4">
                <span className="bg-white/10 px-4 py-2 rounded-full text-sm">{isPositive ? `+${monthChange}% este mês` : "Despesas superiores"}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-container p-5 rounded-lg min-w-0">
                <p className="text-xs text-on-surface-variant">Receitas</p>
                <p className="text-xl sm:text-2xl font-bold text-primary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container p-5 rounded-lg min-w-0">
                <p className="text-xs text-on-surface-variant">Despesas</p>
                <p className="text-xl sm:text-2xl font-bold text-tertiary min-w-0 truncate">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface-container p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Metas de Poupança</h3>
              {savingsGoals.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem metas de poupança</p>
              ) : (
                savingsGoals.map(goal => (
                  <div key={goal.id} className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span>{goal.name}</span>
                      <span className="text-secondary">{Math.round(goal.current_amount / goal.target_amount * 100)}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="bg-surface-container p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Despesas Recentes</h3>
              {filteredTransactions.filter(t => t.type === 'expense').length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem despesas este mês</p>
              ) : (
                filteredTransactions.filter(t => t.type === 'expense').slice(0, 5).map(trans => (
                  <div key={trans.id} className="flex justify-between py-3 border-b border-surface-container-highest">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">shopping_bag</span>
                      <div>
                        <p className="font-medium">{trans.description}</p>
                        <p className="text-xs text-on-surface-variant">{trans.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-tertiary">
                      -{formatCurrencyWithSymbol(trans.amount)}
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