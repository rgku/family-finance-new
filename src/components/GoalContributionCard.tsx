"use client";

import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import type { GoalContribution } from "@/hooks/useGoalContributions";

interface GoalContributionCardProps {
  contribution: GoalContribution;
}

export function GoalContributionCard({ contribution }: GoalContributionCardProps) {
  const goalIcon = contribution.goal_icon || 'savings';
  const goalName = contribution.goal_name || 'Meta';
  
  return (
    <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <Icon name={goalIcon} size={20} className="text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-on-surface truncate">{goalName}</p>
        <p className="text-xs text-on-surface-variant">
          {new Date(contribution.contribution_date).toLocaleDateString("pt-PT", {
            day: 'numeric',
            month: 'short'
          })}
        </p>
      </div>
      
      <div className="text-primary font-bold">
        +{formatCurrencyWithSymbol(contribution.amount)}
      </div>
    </div>
  );
}