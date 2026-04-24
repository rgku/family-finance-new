"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";

interface TaxBenefit {
  category: string;
  totalExpenses: number;
  deductiblePercentage: number;
  deductibleAmount: number;
  potentialRefund: number;
}

interface FiscalSnapshot {
  benefits: TaxBenefit[];
  totalDeductible: number;
  totalPotentialRefund: number;
  yearlyExpenses: number;
  lastYearExpenses: number;
}

const TAX_CATEGORIES: Record<string, { rate: number; label: string }> = {
  "Saúde": { rate: 0.15, label: "Despesas de saúde" },
  "Educação": { rate: 0.30, label: "Despesas de educação" },
  "Habitação": { rate: 0.15, label: "Despesas de habitação" },
  "Lares": { rate: 0.25, label: "Lares de idosos" },
  "Rentings": { rate: 0.15, label: "Rentings de hostelaria" },
};

export function useFiscalSnapshot(): FiscalSnapshot {
  const { transactions } = useData();

  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const currentYearTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getFullYear() === currentYear &&
        t.type === "expense" &&
        Object.keys(TAX_CATEGORIES).includes(t.category)
      );
    });

    const lastYearTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getFullYear() === lastYear &&
        t.type === "expense" &&
        Object.keys(TAX_CATEGORIES).includes(t.category)
      );
    });

    const benefits: TaxBenefit[] = Object.entries(TAX_CATEGORIES).map(([category, info]) => {
      const categoryExpenses = currentYearTransactions
        .filter((t) => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const deductibleAmount = categoryExpenses * info.rate;

      return {
        category: info.label,
        totalExpenses: categoryExpenses,
        deductiblePercentage: info.rate * 100,
        deductibleAmount,
        potentialRefund: deductibleAmount * 0.20,
      };
    });

    const totalDeductible = benefits.reduce((sum, b) => sum + b.deductibleAmount, 0);
    const totalPotentialRefund = benefits.reduce((sum, b) => sum + b.potentialRefund, 0);
    const yearlyExpenses = currentYearTransactions.reduce((sum, t) => sum + t.amount, 0);
    const lastYearExpenses = lastYearTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      benefits,
      totalDeductible,
      totalPotentialRefund,
      yearlyExpenses,
      lastYearExpenses,
    };
  }, [transactions]);
}