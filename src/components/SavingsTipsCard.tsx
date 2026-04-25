"use client";

import { memo } from "react";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";

interface SavingsTip {
  type: "tip";
  title: string;
  description: string;
  impactAmount?: number;
  impactPercentage?: number;
  currentSavingsRate?: number;
  targetSavingsRate?: number;
}

interface SavingsTipsCardProps {
  tips: SavingsTip[];
  currentSavingsRate?: number;
  targetSavingsRate?: number;
}

export const SavingsTipsCard = memo(function SavingsTipsCard({ tips, currentSavingsRate, targetSavingsRate }: SavingsTipsCardProps) {
  if (tips.length === 0 && !currentSavingsRate) return null;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="lightbulb" size={20} className="text-primary" />
        <p className="text-sm font-bold text-on-surface">Dicas de Poupança</p>
      </div>

      {currentSavingsRate !== undefined && targetSavingsRate !== undefined && (
        <div className="mb-4 p-3 bg-surface-container-high rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-on-surface-variant">Poupança Atual</span>
            <span className={`text-lg font-bold ${currentSavingsRate >= targetSavingsRate ? "text-green-500" : "text-amber-500"}`}>
              {currentSavingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentSavingsRate >= targetSavingsRate ? "bg-green-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(currentSavingsRate, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-on-surface-variant">Meta: {targetSavingsRate}%</span>
            <span className="text-on-surface-variant">
              {currentSavingsRate >= targetSavingsRate ? "✅ Meta atingida!" : `Faltam ${(targetSavingsRate - currentSavingsRate).toFixed(1)}%`}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-surface-container-high rounded-lg">
            <Icon name="lightbulb" size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-on-surface">{tip.title}</p>
              <p className="text-xs text-on-surface-variant mt-1">{tip.description}</p>
              {(tip.impactAmount !== undefined || tip.impactPercentage !== undefined) && (
                <div className="flex items-center gap-2 mt-2">
                  {tip.impactAmount !== undefined && (
                    <span className="text-xs font-bold text-primary">
                      +{formatCurrencyWithSymbol(tip.impactAmount)}
                    </span>
                  )}
                  {tip.impactPercentage !== undefined && (
                    <span className="text-xs font-bold text-primary">
                      +{tip.impactPercentage.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs text-on-surface-variant">poupança</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
