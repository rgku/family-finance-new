"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { isDateInCustomMonth, getCustomMonthRange } from "@/lib/dateUtils";

interface SpendingPower {
  available: number;
  dailyBudget: number;
  remainingDays: number;
  breakdown: {
    label: string;
    amount: number;
    type: "income" | "expense";
  }[];
  status: "good" | "warning" | "danger";
  message: string;
}

export function useSpendingPower(): SpendingPower {
  const { transactions, goals, budgets } = useData();
  const { profile } = useAuth();

  return useMemo(() => {
    const now = new Date();
    const billingDay = profile?.billing_cycle_day || 1;
    
    const { startDate, endDate } = getCustomMonthRange(billingDay, now);
    const currentMonth = startDate.getMonth();
    const currentYear = startDate.getFullYear();
    
    const daysInPeriod = billingDay > 1 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = billingDay > 1
      ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : now.getDate();
    const remainingDays = Math.max(0, daysInPeriod - currentDay);

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      if (billingDay > 1) {
        return isDateInCustomMonth(t.date, billingDay, currentYear, currentMonth + 1);
      }
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === "expense" && t.category !== "Investimentos")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const activeGoals = goals.filter((g) => {
      const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      return progress < 100;
    });
    
    const goalsAllocated = activeGoals.reduce((sum, g) => {
      if (g.goal_type === 'savings' && g.created_at) {
        const goalCreated = new Date(g.created_at);
        if (billingDay > 1) {
          if (!isDateInCustomMonth(g.created_at, billingDay, currentYear, currentMonth + 1)) {
            return sum;
          }
        } else {
          if (goalCreated.getFullYear() !== currentYear || goalCreated.getMonth() !== currentMonth) {
            return sum;
          }
        }
        return sum + g.current_amount;
      }
      return sum;
    }, 0);

    const monthlyBudgets = budgets.filter((b) => b.limit > 0);
    const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = monthlyBudgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetRemaining = totalBudget - totalSpent;

    const breakdown = [
      { label: "Receitas este mês", amount: income, type: "income" as const },
      { label: "Despesas este mês", amount: expenses, type: "expense" as const },
      { label: "Metas alocadas", amount: goalsAllocated, type: "expense" as const },
    ];

    const available = balance - goalsAllocated;
    const dailyBudget = remainingDays > 0 ? available / remainingDays : 0;

    let status: "good" | "warning" | "danger" = "good";
    let message = "";

    if (available < 0) {
      status = "danger";
      message = "Ultrapassaste o orçamento este mês";
    } else if (dailyBudget < 0) {
      status = "danger";
      message = "Não tens saldo disponível para gastos";
    } else if (dailyBudget < 5) {
      status = "warning";
      message = `Atenção ao ritmo de gastos (${dailyBudget.toFixed(2)}€/dia)`;
    } else {
      status = "good";
      message = `Podes gastar ~${dailyBudget.toFixed(2)}€/dia`;
    }

    return {
      available,
      dailyBudget,
      remainingDays,
      breakdown,
      status,
      message,
    };
  }, [transactions, goals, budgets, profile?.billing_cycle_day]);
}