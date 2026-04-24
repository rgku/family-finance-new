"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";

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

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = daysInMonth - currentDay;

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const activeGoals = goals.filter((g) => {
      const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      return progress < 100;
    });
    const goalsAllocated = activeGoals.reduce((sum, g) => {
      const monthlyContribution = g.target_amount / 12;
      return sum + Math.min(monthlyContribution, g.target_amount - g.current_amount);
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
  }, [transactions, goals, budgets]);
}