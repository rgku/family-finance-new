"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useAIForecast } from "@/hooks/useAIForecast";
import { useSpendingPower } from "@/hooks/useSpendingPower";
import { useFiscalSnapshot } from "@/hooks/useFiscalSnapshot";
import { useSubscriptionTracker } from "@/hooks/useSubscriptionTracker";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { isDateInCustomMonth, formatCustomMonth, getCustomMonthRange } from "@/lib/dateUtils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { ExpenseChart } from "@/components/charts/ExpenseChart";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { SavingsBarChart } from "@/components/charts/SavingsBarChart";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";
import { AIInsightItem } from "@/lib/ai/types";
import { GoalsProgressCard } from "@/components/GoalsProgressCard";
import { SavingsTipsCard } from "@/components/SavingsTipsCard";
import { AIAlertsCard } from "@/components/AIAlertCard";

export default function AnalyticsPage() {
  const { transactions, goals: dataGoals, budgets } = useData();
  const { profile, signOut } = useAuth();
  const isMobile = useDeviceType();
  const billingDay = profile?.billing_cycle_day || 1;
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Corrigir mês se houver ciclo de faturação personalizado
  useEffect(() => {
    if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
      const now = new Date();
      const { displayYear, displayMonth } = getCustomMonthRange(profile.billing_cycle_day, now);
      const correctMonth = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`;
      setSelectedMonth(correctMonth);
    }
  }, [profile?.billing_cycle_day]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);

  const { insights: aiInsights, loading: aiLoading, refetch, savingsTips, alerts, currentSavingsRate } = useAIInsights(selectedMonth);

  const nextMonthParam = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nm = m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
    return `${nm.year}-${String(nm.month).padStart(2, "0")}`;
  })();
  const { forecasts: aiForecasts, loading: forecastLoading, summary: forecastSummary } = useAIForecast(nextMonthParam);
  
  const monthName = profile?.billing_cycle_day && profile.billing_cycle_day > 1
    ? formatCustomMonth(billingDay, new Date(year, month - 1, 25))
    : monthNames[month - 1];

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

  const income = useMemo(() => filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === "expense" && t.category !== "Investimentos").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const pouparanca = useMemo(() => {
    const investmentExpenses = filteredTransactions.filter(t => t.type === "expense" && t.category === "Investimentos").reduce((sum, t) => sum + t.amount, 0);
    const filteredGoals = dataGoals.filter(g => {
      if (!g.created_at) return false;
      const createdAt = new Date(g.created_at);
      if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
        return isDateInCustomMonth(createdAt.toISOString(), billingDay, year, month);
      }
      return createdAt.getFullYear() === year && createdAt.getMonth() === month - 1;
    });
    const savingsAllocated = filteredGoals.filter(g => g.goal_type === 'savings').reduce((sum, g) => sum + g.current_amount, 0);
    return investmentExpenses + savingsAllocated;
  }, [filteredTransactions, dataGoals, year, month, profile?.billing_cycle_day, billingDay]);

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredTransactions.filter(t => t.type === "expense").forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      category: name,
      amount: value,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Budget vs Reality calculation
  const budgetComparison = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;
    
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const difference = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // Find category with biggest difference
    const categoryDiffs = budgets.map(b => ({
      category: b.category,
      budget: b.limit,
      spent: b.spent,
      difference: b.limit - b.spent,
      percentage: b.limit > 0 ? (b.spent / b.limit) * 100 : 0,
    }));
    
    const worstCategory = categoryDiffs
      .filter(c => c.percentage > 100)
      .sort((a, b) => b.percentage - a.percentage)[0];
    
    const bestCategory = categoryDiffs
      .filter(c => c.percentage < 80)
      .sort((a, b) => a.percentage - b.percentage)[0];
    
    return {
      totalBudget,
      totalSpent,
      difference,
      percentageUsed,
      worstCategory,
      bestCategory,
    };
  }, [budgets]);

  // Savings trend (last 3 months)
  const savingsTrend = useMemo(() => {
    const trend: { month: string; amount: number; percentage: number }[] = [];
    
    for (let i = 2; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 15);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      const monthTransactions = transactions.filter(t => {
        if (billingDay > 1) {
          return isDateInCustomMonth(t.date, billingDay, d.getFullYear(), d.getMonth() + 1);
        }
        const transDate = new Date(t.date);
        return transDate.getFullYear() === d.getFullYear() && transDate.getMonth() === d.getMonth();
      });
      
      const monthIncome = monthTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const monthExpenses = monthTransactions.filter(t => t.type === "expense" && t.category !== "Investimentos").reduce((s, t) => s + t.amount, 0);
      
      const monthSavings = monthIncome - monthExpenses;
      const percentage = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0;
      
      trend.push({
        month: m,
        amount: monthSavings,
        percentage,
      });
    }
    
    return trend;
  }, [transactions, year, month, billingDay]);

  const monthlyTrend = useMemo(() => {
    const months: { month: string; income: number; expense: number; pouparanca: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 15);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTransactions = transactions.filter(t => {
        if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
          return isDateInCustomMonth(t.date, billingDay, d.getFullYear(), d.getMonth() + 1);
        }
        const transDate = new Date(t.date);
        return transDate.getFullYear() === d.getFullYear() && transDate.getMonth() === d.getMonth();
      });
      
      // Filter goals by created_at to this specific month
      const monthSavings = dataGoals.filter(g => {
        if (!g.created_at || g.goal_type !== 'savings') return false;
        const createdAt = new Date(g.created_at);
        if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
          return isDateInCustomMonth(createdAt.toISOString(), billingDay, d.getFullYear(), d.getMonth() + 1);
        }
        return createdAt.getFullYear() === d.getFullYear() && createdAt.getMonth() === d.getMonth();
      });
      const totalSavings = monthSavings.reduce((s, g) => s + g.current_amount, 0);
      const investmentExpenses = monthTransactions
        .filter(t => t.type === "expense" && t.category === "Investimentos")
        .reduce((s, t) => s + t.amount, 0);
      
      const pouparanca = totalSavings + investmentExpenses;
      
      months.push({
        month: m,
        income: monthTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === "expense" && t.category !== "Investimentos").reduce((s, t) => s + t.amount, 0),
        pouparanca,
      });
    }
    
    return months;
  }, [transactions, dataGoals, year, month, profile, billingDay]);

  // Monthly comparison (current vs previous month)
  const monthComparison = useMemo(() => {
    if (monthlyTrend.length < 2) return null;
    const current = monthlyTrend[monthlyTrend.length - 1];
    const previous = monthlyTrend[monthlyTrend.length - 2];
    if (!previous) return null;
    
    const incomeChange = current.income - previous.income;
    const expenseChange = current.expense - previous.expense;
    const incomePercent = previous.income > 0 ? (incomeChange / previous.income) * 100 : 0;
    const expensePercent = previous.expense > 0 ? (expenseChange / previous.expense) * 100 : 0;
    
    return {
      incomeChange,
      expenseChange,
      incomePercent,
      expensePercent,
      incomeDirection: incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'stable',
      expenseDirection: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'stable',
    };
  }, [monthlyTrend]);

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const insightStyles: Record<AIInsightItem["type"], { bg: string; icon: string; color: string }> = {
  success: { bg: "bg-green-500/10", icon: "check_circle", color: "text-green-600" },
  warning: { bg: "bg-amber-500/10", icon: "warning", color: "text-amber-600" },
  info: { bg: "bg-blue-500/10", icon: "info", color: "text-blue-600" },
  tip: { bg: "bg-primary/10", icon: "lightbulb", color: "text-primary" },
  alert: { bg: "bg-red-500/10", icon: "error", color: "text-red-600" },
  anomaly: { bg: "bg-orange-500/10", icon: "trending_up", color: "text-orange-600" },
};

function InsightCard({ insight }: { insight: AIInsightItem }) {
  const style = insightStyles[insight.type] || insightStyles.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${style.bg}`}>
      <Icon name={style.icon as any} size={20} className={`${style.color} mt-0.5 shrink-0`} />
      <div>
        <p className="font-medium text-on-surface">{insight.title}</p>
        <p className="text-sm text-on-surface-variant mt-0.5">{insight.description}</p>
      </div>
    </div>
  );
}

function InMyPocketCard() {
  const { available, dailyBudget, remainingDays, breakdown, status, message } = useSpendingPower();

  const statusStyles = {
    good: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-600",
    warning: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-600",
    danger: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-600",
  };

  if (available <= 0 && status === "danger") return null;

  return (
    <div className={`bg-gradient-to-br p-5 rounded-lg border ${statusStyles[status]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon name="account_balance_wallet" size={20} />
        <p className="text-sm font-medium">In My Pocket</p>
      </div>
      <p className={`text-2xl font-bold`}>
        {formatCurrencyWithSymbol(Math.max(available, 0))}
      </p>
      <p className="text-xs mt-1 opacity-80">{message}</p>
      <div className="mt-4 pt-3 border-t border-current/20 space-y-2">
        {breakdown.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>{item.label}</span>
            <span className={item.type === "income" ? "text-green-500" : "text-red-400"}>
              {item.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(item.amount)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs mt-3 pt-3 border-t border-current/20">
        {remainingDays} dias restantes no mês
      </p>
    </div>
  );
}

function FiscalSnapshotCard() {
  const { benefits, totalDeductible, totalPotentialRefund, yearlyExpenses, lastYearExpenses } = useFiscalSnapshot();

  if (yearlyExpenses === 0) return null;

  const hasBenefits = benefits.some((b) => b.totalExpenses > 0);
  if (!hasBenefits) return null;

  return (
    <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="receipt_long" size={20} className="text-secondary" />
        <p className="text-sm font-medium">Benefícios Fiscais</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-on-surface-variant">Dedutível</p>
          <p className="text-lg font-bold text-secondary">
            {formatCurrencyWithSymbol(totalDeductible)}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">Potencial reembolso</p>
          <p className="text-lg font-bold text-green-500">
            {formatCurrencyWithSymbol(totalPotentialRefund)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {benefits
          .filter((b) => b.totalExpenses > 0)
          .map((benefit, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="truncate">{benefit.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant">
                  {formatCurrencyWithSymbol(benefit.totalExpenses)} ({benefit.deductiblePercentage}%)
                </span>
                <span className="text-green-500 font-medium">
                  +{formatCurrencyWithSymbol(benefit.potentialRefund)}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function SubscriptionTrackerCard() {
  const { subscriptions, totalMonthly, totalYearly, activeCount, zombieCount, potentialSavings } = useSubscriptionTracker();

  if (activeCount === 0) return null;

  return (
    <div className="bg-surface-container rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="subscriptions" size={20} className="text-primary" />
          <p className="text-sm font-medium">Subscriptions</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrencyWithSymbol(totalMonthly)}/mês</p>
          <p className="text-xs text-on-surface-variant">
            {formatCurrencyWithSymbol(totalYearly)}/ano
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {subscriptions.slice(0, 5).map((sub) => (
          <div key={sub.id} className="flex items-center justify-between py-2 border-b border-surface-container-high last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name={sub.icon} size={16} className="text-secondary shrink-0" />
              <span className="text-sm truncate">{sub.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium">{formatCurrencyWithSymbol(sub.amount)}</span>
              {sub.isZombie && (
                <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                  Zombie
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {zombieCount > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-container-high">
          <p className="text-xs text-red-400">
            ⚠️ {zombieCount} subscription(zombie) detectada(s) - Poupança potencial: {formatCurrencyWithSymbol(potentialSavings)}
          </p>
        </div>
      )}
    </div>
  );
}

const pageContent = (
    <>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Análise Financeira</h1>
          <p className="text-on-surface-variant">Veja onde o seu dinheiro está a ir</p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-4 py-2 bg-surface-container rounded-lg">
        <button
          onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="text-xl font-bold text-on-surface min-w-[160px] text-center">
          {profile?.billing_cycle_day && profile.billing_cycle_day > 1
            ? monthName
            : `${monthName} ${year}`}
        </span>
        <button
          onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
          disabled={!canGoNext}
          className={`p-2 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container-high cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-container p-5 sm:p-6 rounded-lg text-on-primary min-w-0">
          <p className="text-xs sm:text-sm opacity-80">Receitas</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold mt-1 text-wrap">{formatCurrencyWithSymbol(income)}</p>
        </div>
        <div className="bg-surface-container p-5 sm:p-6 rounded-lg min-w-0">
          <p className="text-xs sm:text-sm text-on-surface-variant">Despesas</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-tertiary mt-1 text-wrap">{formatCurrencyWithSymbol(expenses)}</p>
        </div>
        <div className="bg-surface-container p-5 sm:p-6 rounded-lg min-w-0">
          <p className="text-xs sm:text-sm text-on-surface-variant">Poupança</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-secondary mt-1 text-wrap">{formatCurrencyWithSymbol(pouparanca)}</p>
        </div>
      </div>

      {/* vs Budget Card */}
      {budgetComparison && (
        <div className={`p-5 sm:p-6 rounded-lg min-w-0 ${
          budgetComparison.difference >= 0 
            ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30' 
            : 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="account_balance_wallet" size={20} className={budgetComparison.difference >= 0 ? "text-green-500" : "text-red-500"} />
            <p className="text-sm font-medium text-on-surface">vs Orçamento</p>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${budgetComparison.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
            {budgetComparison.difference >= 0 ? '+' : ''}{formatCurrencyWithSymbol(budgetComparison.difference)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {budgetComparison.totalSpent}€ gastos de {budgetComparison.totalBudget}€ ({Math.round(budgetComparison.percentageUsed)}%)
          </p>
          {budgetComparison.worstCategory && (
            <div className="mt-3 pt-3 border-t border-on-surface/10">
              <p className="text-xs text-red-400">
                ⚠️ {budgetComparison.worstCategory.category} sobre orçamento ({Math.round(budgetComparison.worstCategory.percentage)}%)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Comparison Card */}
      {monthComparison && (
        <div className="bg-surface-container p-5 sm:p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="trending_up" size={20} className="text-primary" />
            <p className="text-sm font-medium text-on-surface">vs Mês Anterior</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">Receitas</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${monthComparison.incomeDirection === 'up' ? 'text-green-500' : monthComparison.incomeDirection === 'down' ? 'text-red-500' : 'text-on-surface'}`}>
                  {monthComparison.incomeDirection === 'up' ? '↑' : monthComparison.incomeDirection === 'down' ? '↓' : '→'}
                </span>
                <span className="text-lg font-bold text-on-surface">
                  {formatCurrencyWithSymbol(monthComparison.incomeChange)}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {monthComparison.incomePercent >= 0 ? '+' : ''}{monthComparison.incomePercent.toFixed(1)}%
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">Despesas</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${monthComparison.expenseDirection === 'up' ? 'text-red-500' : monthComparison.expenseDirection === 'down' ? 'text-green-500' : 'text-on-surface'}`}>
                  {monthComparison.expenseDirection === 'up' ? '↑' : monthComparison.expenseDirection === 'down' ? '↓' : '→'}
                </span>
                <span className="text-lg font-bold text-on-surface">
                  {formatCurrencyWithSymbol(monthComparison.expenseChange)}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {monthComparison.expensePercent >= 0 ? '+' : ''}{monthComparison.expensePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Tendência Mensal (6 meses)</h3>
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      {/* Savings Trend (3 months) */}
      {savingsTrend.length > 0 && (
        <div className="bg-surface-container rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Tendência Poupança (3 meses)</h3>
          <div className="space-y-3">
            {savingsTrend.map((item, idx) => {
              const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
              const [, m] = item.month.split("-").map(Number);
              const isPositive = item.amount >= 0;
              return (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="text-sm text-on-surface-variant w-12">{monthNames[m - 1]}</span>
                  <div className="flex-1 h-6 bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isPositive ? "bg-gradient-to-r from-green-500 to-green-400" : "bg-gradient-to-r from-red-500 to-red-400"}`}
                      style={{ width: `${Math.min(Math.abs(item.percentage), 100)}%` }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {item.percentage >= 0 ? '+' : ''}{Math.round(item.percentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Progress */}
      <GoalsProgressCard goals={dataGoals} />

      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-6">Despesas por Categoria</h3>
        <ExpenseChart data={categoryBreakdown} />
      </div>

      <InMyPocketCard />

      <FiscalSnapshotCard />

      <SubscriptionTrackerCard />

      {/* Tendência de Poupança (3 meses) */}
      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon name="trending_up" size={20} className="text-secondary" />
          Tendência de Poupança
        </h3>
        <SavingsBarChart data={savingsTrend} />
      </div>

      {/* Dicas de Poupança IA */}
      {(savingsTips.length > 0 || currentSavingsRate !== undefined) && (
        <SavingsTipsCard
          tips={savingsTips}
          currentSavingsRate={currentSavingsRate}
          targetSavingsRate={30}
        />
      )}

      {/* Alertas IA */}
      {alerts.length > 0 && (
        <AIAlertsCard alerts={alerts} />
      )}

      <div className="bg-surface-container rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon name="sparkles" size={20} className="text-primary" />
            Insights da IA
          </h3>
          {!aiLoading && (
            <button
              onClick={() => refetch(selectedMonth, true)}
              className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="Gerar novos insights"
            >
              <Icon name="refresh" size={16} />
            </button>
          )}
        </div>

        {aiLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant text-sm">A analisar os teus dados...</span>
          </div>
        ) : aiInsights.length === 0 && categoryBreakdown.length === 0 ? (
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Icon name="lightbulb" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium">Sem dados suficientes</p>
              <p className="text-sm text-on-surface-variant">
                Adicione transações para ver recomendações personalizadas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {aiInsights
              .filter(i => i.type !== "tip" && i.type !== "alert")
              .filter(i => !(i.type === "warning" && (
                i.title.toLowerCase().includes("+") ||
                i.description.toLowerCase().includes("aumentou") ||
                i.description.toLowerCase().includes("cresceu") ||
                i.description.toLowerCase().includes("mais que") ||
                i.percentage !== undefined && i.percentage > 30
              )))
              .map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
          </div>
        )}
      </div>

      {aiForecasts.length > 0 && (
        <div className="bg-surface-container rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Icon name="trending_up" size={20} className="text-secondary" />
              Previsão para Próximo Mês
            </h3>
            {forecastSummary && (
              <span className="text-sm text-on-surface-variant">
                Total: {formatCurrencyWithSymbol(forecastSummary.totalPredicted)}
              </span>
            )}
          </div>

          {forecastLoading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-on-surface-variant text-sm">A gerar previsão...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {aiForecasts.slice(0, 6).map((forecast) => {
                const trendIcon = forecast.trend === "up" ? "trending_up" : forecast.trend === "down" ? "trending_down" : "trending_flat";
                const trendColor = forecast.trend === "up" ? "text-error" : forecast.trend === "down" ? "text-green-500" : "text-on-surface-variant";
                const catIcon = EXPENSE_CATEGORIES.find(c => c.value === forecast.category)?.icon || "folder";
                return (
                  <div key={forecast.category} className="flex items-center gap-3">
                    <Icon name={catIcon} size={20} className="text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">{forecast.category}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Icon name={trendIcon} size={16} className={trendColor} />
                          <span className={`text-sm font-bold ${trendColor}`}>
                            {forecast.changePercent > 0 ? "+" : ""}{forecast.changePercent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "100%" }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-on-surface-variant">{formatCurrencyWithSymbol(forecast.predictedAmount)}</span>
                        <span className="text-xs text-on-surface-variant">
                          {formatCurrencyWithSymbol(forecast.confidenceLow)} - {formatCurrencyWithSymbol(forecast.confidenceHigh)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {forecastSummary && (
                <p className="text-sm text-on-surface-variant mt-3 italic">{forecastSummary.narrative}</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-24 px-4 pb-24 space-y-6 max-w-2xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return <div className="p-8 pb-32 md:pb-8 space-y-8">{pageContent}</div>;
}