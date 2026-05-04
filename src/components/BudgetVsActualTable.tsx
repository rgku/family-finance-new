"use client";

import { useMemo } from "react";
import { Icon } from "@/components/Icon";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Budget } from "@/hooks/DataProvider";

interface BudgetVsActualTableProps {
  budgets: Budget[];
  month?: string;
}

interface BudgetWithCalc extends Budget {
  percentage: number;
  difference: number;
}

export function BudgetVsActualTable({ budgets, month }: BudgetVsActualTableProps) {
  const { sortedBudgets, totals } = useMemo(() => {
    if (!budgets || budgets.length === 0) return { sortedBudgets: [], totals: { totalLimit: 0, totalSpent: 0, totalDifference: 0 } };
    
    const filtered = month ? budgets.filter(b => b.month === month) : budgets;
    
    const withCalc: BudgetWithCalc[] = filtered.map(b => ({
      ...b,
      percentage: b.limit > 0 ? (b.spent / b.limit) * 100 : 0,
      difference: b.limit - b.spent,
    }));
    
    const sorted = [...withCalc].sort((a, b) => b.percentage - a.percentage);
    
    const totals = sorted.reduce(
      (acc, b) => ({
        totalLimit: acc.totalLimit + b.limit,
        totalSpent: acc.totalSpent + b.spent,
        totalDifference: acc.totalDifference + b.difference,
      }),
      { totalLimit: 0, totalSpent: 0, totalDifference: 0 }
    );
    
    return { sortedBudgets: sorted, totals };
  }, [budgets, month]);

  if (sortedBudgets.length === 0) {
    return (
      <div className="bg-surface-container rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="account_balance_wallet" size={20} className="text-primary" />
          <h3 className="font-bold text-lg">Orçamento vs Gastos Reais</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
          <Icon name="info" size={20} className="text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-on-surface-variant">Nenhum orçamento definido para este mês.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="account_balance_wallet" size={20} className="text-primary" />
        <h3 className="font-bold text-lg">Orçamento vs Gastos Reais</h3>
      </div>

      <div className="space-y-4">
        {sortedBudgets.map((budget) => {
          const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === budget.category);
          const icon = categoryInfo?.icon || "folder";
          const isOverBudget = budget.percentage > 100;
          const isNearLimit = budget.percentage >= 80 && budget.percentage <= 100;
          
          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon name={icon} size={16} className="text-secondary shrink-0" />
                  <span className="text-sm font-medium truncate">{budget.category}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-bold ${isOverBudget ? "text-error" : isNearLimit ? "text-amber-500" : "text-green-500"}`}>
                    {formatCurrencyWithSymbol(budget.difference)}
                  </span>
                  <span className="text-xs text-on-surface-variant w-20 text-right">
                    {formatCurrencyWithSymbol(budget.spent)} / {formatCurrencyWithSymbol(budget.limit)}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isOverBudget 
                      ? "bg-gradient-to-r from-error to-red-400" 
                      : isNearLimit
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-green-500 to-green-400"
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${isOverBudget ? "text-error" : isNearLimit ? "text-amber-500" : "text-green-500"}`}>
                  {isOverBudget ? "⬆" : isNearLimit ? "⚠" : "✓"} {Math.round(budget.percentage)}%
                </span>
                <span className="text-on-surface-variant">
                  {isOverBudget 
                    ? `Excedeu ${formatCurrencyWithSymbol(Math.abs(budget.difference))}`
                    : `Restam ${formatCurrencyWithSymbol(budget.difference)}`
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-surface-container-high">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-on-surface-variant">Total Orçado</p>
            <p className="text-sm font-bold text-on-surface">
              {formatCurrencyWithSymbol(totals.totalLimit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Total Gasto</p>
            <p className="text-sm font-bold text-tertiary">
              {formatCurrencyWithSymbol(totals.totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Saldo</p>
            <p className={`text-sm font-bold ${totals.totalDifference >= 0 ? "text-green-500" : "text-error"}`}>
              {formatCurrencyWithSymbol(totals.totalDifference)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
