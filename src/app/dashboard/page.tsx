"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol, calculatePercentage, calculateMonthChange } from "@/lib/currency";
import { useSpendingPower } from "@/hooks/useSpendingPower";
import { isDateInCustomMonth, formatCustomMonth, getCustomMonthRange } from "@/lib/dateUtils";
import Link from "next/link";

import { MobileHeader } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";
import { CategoryPieChart } from "@/components/charts";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

function getCategoryIcon(category: string): string {
  const found = EXPENSE_CATEGORIES.find(c => c.value === category);
  return found?.icon || "credit_card";
}

export default function Dashboard() {
  const { user, signOut, supabase, loading, profile } = useAuth();
  const { transactions, goals: dataGoals } = useData();
  const isMobile = useDeviceType();
  
  const billingDay = profile?.billing_cycle_day || 1;
  
  // Initialize selectedMonth based on billing cycle
  // Use CLIENT date only (avoid SSR timezone issues)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Update selectedMonth when profile/billingDay changes or on mount
  useEffect(() => {
    if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
      const now = new Date(); // Use client date
      const { displayYear, displayMonth } = getCustomMonthRange(profile.billing_cycle_day, now);
      const correctMonth = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`;
      setSelectedMonth(correctMonth);
    } else {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
  }, [profile?.billing_cycle_day]);
  
  // Prevent rendering until selectedMonth is set
  if (selectedMonth === null) {
    return null; // Or show loading skeleton
  }

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);
  
  const monthName = profile?.billing_cycle_day && profile.billing_cycle_day > 1
    ? formatCustomMonth(billingDay, new Date(year, month - 1, billingDay))
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

  const { totalIncome, totalExpenses, totalPoupanca, balance, savingsGoals, expenseGoals, expenseByCategory } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    
    const investmentExpenses = filteredTransactions
      .filter(t => t.type === "expense" && t.category === "Investimentos")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const normalExpenses = filteredTransactions
      .filter(t => t.type === "expense" && t.category !== "Investimentos")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Filter goals by creation date to current month only
    const filteredGoals = dataGoals.filter(g => {
      if (!g.created_at) return true;
      const createdAt = new Date(g.created_at);
      if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
        return isDateInCustomMonth(createdAt.toISOString(), billingDay, year, month);
      }
      return createdAt.getFullYear() === year && createdAt.getMonth() === month - 1;
    });
    
    const savings = filteredGoals.filter(g => g.goal_type === 'savings');
    const expenses = filteredGoals.filter(g => g.goal_type === 'expense');
    
    const savingsAllocated = savings.reduce((sum, g) => sum + g.current_amount, 0);
    const totalPoupanca = savingsAllocated + investmentExpenses;
    
    const expenseByCat = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const expenseCategories = Object.entries(expenseByCat).map(([category, amount]) => ({
      category,
      amount,
    }));
    
    const totalExpenses = normalExpenses;
    const balance = income - normalExpenses - totalPoupanca;
    
    return { 
      totalIncome: income,
      totalExpenses,
      totalPoupanca,
      balance: { total: balance, income, expenses: normalExpenses, poupar: totalPoupanca },
      savingsGoals: savings,
      expenseGoals: expenses,
      expenseByCategory: expenseCategories,
    };
  }, [filteredTransactions, dataGoals]);

  const monthChange = useMemo(() => {
    return calculateMonthChange(totalIncome, totalExpenses);
  }, [totalIncome, totalExpenses]);
  
  const isPositive = balance.total >= 0;

  const { available, dailyBudget, status } = useSpendingPower();

  function InMyPocketSmallCard() {
    if (available <= 0) return null;

    const statusColors = {
      good: "text-green-500",
      warning: "text-amber-500",
      danger: "text-red-500",
    };

    return (
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="account_balance_wallet" size={18} className="text-green-500" />
          <p className="font-label text-sm font-medium text-on-surface">In My Pocket</p>
        </div>
        <p className={`font-headline text-2xl font-bold ${statusColors[status]}`}>
          {formatCurrencyWithSymbol(Math.max(available, 0))}
        </p>
        <div className="flex items-center justify-between mt-3 text-xs text-on-surface-variant">
          <span>~{dailyBudget.toFixed(2)}€/dia</span>
          <span className={status === "good" ? "text-green-500" : status === "warning" ? "text-amber-500" : "text-red-500"}>
            {status === "good" ? "✓" : status === "warning" ? "⚠" : "✕"} {status === "good" ? "No orçamento" : status === "warning" ? "Atenção" : "Ultrapassado"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
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
                <Icon name="chevron_left" size={20} />
              </button>
              <span className="text-sm font-bold text-on-surface min-w-[120px] text-center">
                {profile?.billing_cycle_day && profile.billing_cycle_day > 1
                  ? monthName
                  : `${monthName} ${year}`}
              </span>
              <button
                onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
                disabled={!canGoNext}
                className={`p-1 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container" : "opacity-50"}`}
              >
                <Icon name="chevron_right" size={20} />
              </button>
            </div>
          </div>

          <main className="pt-28 px-6 max-w-2xl mx-auto space-y-8 pb-32">
            <section className={`mt-4 relative overflow-hidden rounded-lg p-8 shadow-2xl ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="font-label text-sm font-medium opacity-80 mb-1">Saldo Atual</p>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight min-w-0 truncate">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full">
                <Icon name={isPositive ? "trending_up" : "trending_down"} size={20} fill />
                <span>{isPositive ? `+${monthChange}% este mês` : "Despesas superiores"}</span>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-surface-container rounded-lg p-4 min-w-0">
                <p className="font-label text-xs text-on-surface-variant">Receitas</p>
                <p className="font-headline text-xl sm:text-lg font-bold text-primary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container rounded-lg p-4 min-w-0">
                <p className="font-label text-xs text-on-surface-variant">Despesas</p>
                <p className="font-headline text-xl sm:text-lg font-bold text-tertiary min-w-0 truncate">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
              <div className="bg-surface-container rounded-lg p-4 min-w-0">
                <p className="font-label text-xs text-on-surface-variant">Poupança</p>
                <p className="font-headline text-xl sm:text-lg font-bold text-secondary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.poupar)}</p>
              </div>
            </div>

            <InMyPocketSmallCard />

            <section className="bg-surface-container rounded-lg p-4">
              <h3 className="font-headline text-lg font-bold text-on-surface mb-4">Despesas por Categoria</h3>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-on-surface-variant">A carregar gráfico...</div>}>
                <CategoryPieChart data={expenseByCategory} />
              </Suspense>
            </section>

            <section className="bg-surface-container rounded-lg p-4">
              <h3 className="font-headline text-lg font-bold text-on-surface mb-4">Despesas Recentes</h3>
              {filteredTransactions.filter(t => t.type === 'expense').length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem despesas este mês</p>
              ) : (
                filteredTransactions.filter(t => t.type === 'expense').slice(0, 5).map(trans => (
                  <div key={trans.id} className="flex justify-between py-3 border-b border-surface-container-highest last:border-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon name={getCategoryIcon(trans.category)} size={18} className="text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{trans.description}</p>
                        <p className="text-xs text-on-surface-variant">{trans.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-tertiary text-sm shrink-0 ml-2">
                      -{formatCurrencyWithSymbol(trans.amount)}
                    </span>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-4">
              <h3 className="font-headline text-xl font-bold text-on-surface">Metas de Poupança</h3>
              {savingsGoals.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem metas de poupança</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savingsGoals.map(goal => (
                    <div key={goal.id} className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon name={goal.icon} size={16} className="text-secondary" />
                          <span className="font-medium text-sm truncate">{goal.name}</span>
                        </div>
                        <span className="font-bold text-secondary text-sm">{Math.round(calculatePercentage(goal.current_amount, goal.target_amount))}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-secondary to-on-secondary-container" style={{ width: `${calculatePercentage(goal.current_amount, goal.target_amount)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Link href="/dashboard/budgets" className="block bg-surface-container rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="pie_chart" size={20} className="text-tertiary" />
                <span className="font-semibold">Orçamentos</span>
              </div>
              <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
            </Link>
          </main>
        </>
      ) : (
        <main className="p-8 pb-32 md:pb-8 space-y-8">
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
              <Icon name="chevron_left" size={20} />
            </button>
            <span className="text-lg font-bold text-on-surface min-w-[160px] text-center">
              {profile?.billing_cycle_day && profile.billing_cycle_day > 1
                ? monthName
                : `${monthName} ${year}`}
            </span>
            <button
              onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
              disabled={!canGoNext}
              className={`p-2 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container-high" : "opacity-50"}`}
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className={`p-6 rounded-lg min-w-0 ${isPositive ? "bg-gradient-to-br from-primary to-primary-container text-on-primary" : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"}`}>
              <p className="text-sm opacity-80">Saldo</p>
              <h2 className="text-3xl sm:text-4xl font-bold mt-1 min-w-0 truncate">{formatCurrencyWithSymbol(balance.total)}</h2>
              <div className="mt-4 flex gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm">{isPositive ? `+${monthChange}% este mês` : "Negativo"}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container p-4 rounded-lg min-w-0">
                <p className="text-xs text-on-surface-variant">Receitas</p>
                <p className="text-lg sm:text-xl font-bold text-primary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.income)}</p>
              </div>
              <div className="bg-surface-container p-4 rounded-lg min-w-0">
                <p className="text-xs text-on-surface-variant">Despesas</p>
                <p className="text-lg sm:text-xl font-bold text-tertiary min-w-0 truncate">-{formatCurrencyWithSymbol(balance.expenses)}</p>
              </div>
              <div className="bg-surface-container p-4 rounded-lg min-w-0">
                <p className="text-xs text-on-surface-variant">Poupança</p>
                <p className="text-lg sm:text-xl font-bold text-secondary min-w-0 truncate">+{formatCurrencyWithSymbol(balance.poupar)}</p>
              </div>
            </div>

            <InMyPocketSmallCard />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface-container p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Despesas por Categoria</h3>
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-on-surface-variant">A carregar gráfico...</div>}>
                  <CategoryPieChart data={expenseByCategory} />
                </Suspense>
              </div>
              <div className="bg-surface-container p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Despesas Recentes</h3>
                {filteredTransactions.filter(t => t.type === 'expense').length === 0 ? (
                  <p className="text-on-surface-variant text-center py-4">Sem despesas este mês</p>
                ) : (
                  filteredTransactions.filter(t => t.type === 'expense').slice(0, 5).map(trans => (
                    <div key={trans.id} className="flex justify-between py-3 border-b border-surface-container-highest last:border-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Icon name={getCategoryIcon(trans.category)} size={20} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{trans.description}</p>
                          <p className="text-xs text-on-surface-variant">{trans.category}</p>
                        </div>
                      </div>
                      <span className="font-bold text-tertiary shrink-0 ml-2">
                        -{formatCurrencyWithSymbol(trans.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-container p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Metas de Poupança</h3>
              {savingsGoals.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">Sem metas de poupança</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {savingsGoals.map(goal => (
                    <div key={goal.id} className="bg-surface-container-low rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon name={goal.icon} size={18} className="text-secondary" />
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <span className="text-secondary text-sm font-bold">{Math.round(calculatePercentage(goal.current_amount, goal.target_amount))}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-highest rounded-full">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${calculatePercentage(goal.current_amount, goal.target_amount)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </>
  );
}