"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";
import { useAuth } from "@/components/AuthProvider";
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
    const periodYear = startDate.getFullYear();
    const periodMonth = startDate.getMonth() + 1; // 1-indexed para isDateInCustomMonth
    
    console.log('[SpendingPower] Billing day:', billingDay);
    console.log('[SpendingPower] Período:', periodYear, '-', periodMonth);
    console.log('[SpendingPower] Start:', startDate, 'End:', endDate);
    console.log('[SpendingPower] Total transações:', transactions.length);
    console.log('[SpendingPower] Total budgets:', budgets.length);
    console.log('[SpendingPower] Total goals:', goals.length);
    
    const daysInPeriod = billingDay > 1 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : new Date(periodYear, periodMonth, 0).getDate();
    const currentDay = billingDay > 1
      ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : now.getDate();
    const remainingDays = Math.max(0, daysInPeriod - currentDay);

    // Filtrar transações do período atual
    const periodTransactions = transactions.filter((t) => {
      if (billingDay > 1) {
        return isDateInCustomMonth(t.date, billingDay, periodYear, periodMonth);
      }
      const date = new Date(t.date);
      return date.getFullYear() === periodYear && date.getMonth() === periodMonth - 1;
    });

    console.log('[SpendingPower] Transações no período:', periodTransactions.length);
    
    const income = periodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = periodTransactions
      .filter((t) => t.type === "expense" && t.category !== "Investimentos")
      .reduce((sum, t) => sum + t.amount, 0);

    console.log('[SpendingPower] Income:', income, 'Expenses:', expenses);

    // Usar budgets já calculados (o spent vem do DataProvider)
    const totalBudget = budgets.filter(b => b.limit > 0).reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetRemaining = totalBudget - totalSpent;

    console.log('[SpendingPower] Budgets:', totalBudget, 'Spent:', totalSpent, 'Remaining:', budgetRemaining);

    // Calcular poupança alocada este mês
    const goalsAllocated = goals.filter(g => {
      if (g.goal_type !== 'savings' || !g.created_at) return false;
      const goalCreated = new Date(g.created_at);
      if (billingDay > 1) {
        return isDateInCustomMonth(g.created_at, billingDay, periodYear, periodMonth);
      }
      return goalCreated.getFullYear() === periodYear && goalCreated.getMonth() === periodMonth - 1;
    }).reduce((sum, g) => sum + g.current_amount, 0);

    console.log('[SpendingPower] Goals allocated:', goalsAllocated);

    // In My Pocket = Saldo disponível - metas alocadas
    const balance = income - expenses;
    const available = balance - goalsAllocated;
    
    console.log('[SpendingPower] Balance:', balance, 'Available:', available);
    
    const breakdown = [
      { label: "Receitas este mês", amount: income, type: "income" as const },
      { label: "Despesas este mês", amount: expenses, type: "expense" as const },
      { label: "Metas alocadas", amount: goalsAllocated, type: "expense" as const },
    ];

    const dailyBudget = remainingDays > 0 ? available / remainingDays : 0;

    console.log('[SpendingPower] Daily budget:', dailyBudget, 'Remaining days:', remainingDays);

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

    console.log('[SpendingPower] Final:', { available, dailyBudget, status, message });

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