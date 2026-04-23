"use client";

import { ReactNode } from "react";
import { useCheckPlanLimit, useSubscription } from "@/hooks/useSubscription";
import { Icon } from "@/components/Icon";
import Link from "next/link";

interface PlanLimitGuardProps {
  children: ReactNode;
  feature: 'members' | 'budgets' | 'goals' | 'aiInsights';
  currentCount: number;
  fallback?: ReactNode;
}

export function PlanLimitGuard({ 
  children, 
  feature, 
  currentCount,
  fallback 
}: PlanLimitGuardProps) {
  const { checkLimit, currentPlan } = useCheckPlanLimit(feature);
  const limit = checkLimit(currentCount);

  if (!limit.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-surface-container rounded-lg p-6 text-center">
        <Icon name="lock" size={48} className="text-on-surface-variant mx-auto mb-4 opacity-50" />
        <h3 className="font-bold text-lg text-on-surface mb-2">
          Limite do Plano Atingido
        </h3>
        <p className="text-on-surface-variant mb-4">
          Atingiste o limite de {feature === 'members' ? 'membros' : 
                                  feature === 'budgets' ? 'orçamentos' :
                                  feature === 'goals' ? 'metas' : 'AI Insights'} 
          no plano {currentPlan === 'free' ? 'Free' : currentPlan === 'premium' ? 'Premium' : 'Family'}.
        </p>
        <p className="text-sm text-on-surface-variant mb-6">
          Atual: {limit.current} / {limit.max}
        </p>
        <Link
          href="/dashboard/settings/subscription"
          className="inline-block px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110 transition-all"
        >
          Upgrade para mais {feature === 'members' ? 'membros' : 'funcionalidades'}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PremiumFeature({ children, fallback }: PremiumFeatureProps) {
  const { isPaid } = useSubscription();

  if (!isPaid) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon name="diamond" size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-on-surface mb-2">
              Funcionalidade Premium
            </h3>
            <p className="text-on-surface-variant mb-4">
              Esta funcionalidade está disponível apenas nos planos Premium e Family.
            </p>
            <ul className="space-y-2 mb-6 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-primary" />
                Histórico ilimitado
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-primary" />
                Orçamentos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-primary" />
                AI Insights
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-primary" />
                Export PDF
              </li>
            </ul>
            <Link
              href="/dashboard/settings/subscription"
              className="inline-block px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110 transition-all"
            >
              Ver Planos Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useFeatureLimits() {
  const { checkLimit: checkMembers } = useCheckPlanLimit('members');
  const { checkLimit: checkBudgets } = useCheckPlanLimit('budgets');
  const { checkLimit: checkGoals } = useCheckPlanLimit('goals');
  const { checkLimit: checkAIInsights } = useCheckPlanLimit('aiInsights');

  return {
    members: checkMembers,
    budgets: checkBudgets,
    goals: checkGoals,
    aiInsights: checkAIInsights,
  };
}
