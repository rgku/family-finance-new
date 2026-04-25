"use client";

import { memo } from "react";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  goal_type: string;
  deadline?: string | null;
  created_at?: string | null;
}

interface GoalsProgressCardProps {
  goals: Goal[];
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return "bg-green-500";
  if (progress >= 80) return "bg-primary";
  if (progress >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressTextColor(progress: number): string {
  if (progress >= 100) return "text-green-500";
  if (progress >= 80) return "text-primary";
  if (progress >= 50) return "text-amber-500";
  return "text-red-500";
}

function monthsUntil(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(1, months);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-PT", { month: "short", year: "numeric" });
}

export const GoalsProgressCard = memo(function GoalsProgressCard({ goals }: GoalsProgressCardProps) {
  const activeGoals = goals.filter(g => {
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
    return progress < 100;
  });

  const completedGoals = goals.filter(g => {
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
    return progress >= 100;
  });

  if (goals.length === 0) return null;

  return (
    <div className="bg-surface-container rounded-lg p-6">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        <Icon name="flag" size={20} className="text-secondary" />
        Metas
      </h3>

      <div className="space-y-4">
        {activeGoals.map((goal) => {
          const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          const remaining = goal.target_amount - goal.current_amount;
          const monthsLeft = goal.deadline ? monthsUntil(goal.deadline) : 12;
          const monthlyNeeded = remaining / monthsLeft;
          const progressColor = getProgressColor(progress);
          const textColor = getProgressTextColor(progress);

          return (
            <div key={goal.id} className="bg-surface-container-high rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface">{goal.name}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {formatCurrencyWithSymbol(goal.current_amount)} de {formatCurrencyWithSymbol(goal.target_amount)}
                  </p>
                </div>
                <span className={`text-sm font-bold ${textColor}`}>
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden mb-3">
                <div
                  className={`${progressColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Icon name="trending_up" size={14} />
                  <span>Faltam {formatCurrencyWithSymbol(remaining)}</span>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <Icon name="event" size={14} />
                    <span>Até {formatDate(goal.deadline)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-primary">
                  <Icon name="lightbulb" size={14} />
                  <span>Poupa {formatCurrencyWithSymbol(monthlyNeeded)}/mês</span>
                </div>
              </div>
            </div>
          );
        })}

        {completedGoals.length > 0 && (
          <>
            <div className="border-t border-surface-container-highest pt-4 mt-4">
              <h4 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-2">
                <Icon name="check_circle" size={16} className="text-green-500" />
                Metas Completadas
              </h4>
              <div className="space-y-3">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="bg-surface-container-high rounded-lg p-4 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-on-surface line-through">{goal.name}</h4>
                        <p className="text-xs text-green-500 mt-0.5 flex items-center gap-1">
                          <Icon name="check" size={14} />
                          Completada!
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-500">
                        {formatCurrencyWithSymbol(goal.current_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
