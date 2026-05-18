"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";
import { useAuth } from "@/components/AuthProvider";
import { isDateInCustomMonth } from "@/lib/dateUtils";

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

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    let monthlyTransactions;
    if (billingDay > 1) {
      let cycleMonth = currentDay >= billingDay ? currentMonth + 2 : currentMonth + 1;
      let cycleYear = currentYear;
      if (cycleMonth > 12) { cycleYear++; cycleMonth -= 12; }
      if (cycleMonth < 1) { cycleYear--; cycleMonth += 12; }
      monthlyTransactions = transactions.filter((t) =>
        isDateInCustomMonth(t.date, billingDay, cycleYear, cycleMonth)
      );
    } else {
      monthlyTransactions = transactions.filter((t) => {
        const [y, m] = t.date.split('-').map(Number);
        return y === currentYear && m === currentMonth + 1;
      });
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const goalsAllocated = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

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