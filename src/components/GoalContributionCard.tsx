"use client";

import { useState } from "react";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import type { GoalContribution } from "@/hooks/useGoalContributions";

interface GoalContributionCardProps {
  contribution: GoalContribution;
  isEditing: boolean;
  editForm: { amount: string; date: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFormChange: (field: string, value: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}

export function GoalContributionCard({
  contribution,
  isEditing,
  editForm,
  onEdit,
  onDelete,
  onFormChange,
  onSave,
  onCancel,
}: GoalContributionCardProps) {
  const goalIcon = contribution.goal_icon || 'savings';
  const goalName = contribution.goal_name || 'Meta';
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon name={goalIcon} size={20} className="text-primary" />
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="font-medium text-on-surface text-sm">{goalName}</p>
          <input
            type="date"
            value={editForm.date}
            onChange={(e) => onFormChange("date", e.target.value)}
            className="bg-surface-container-low border-none rounded px-2 py-1 text-on-surface text-xs w-full"
          />
          <input
            type="number"
            step="0.01"
            value={editForm.amount}
            onChange={(e) => onFormChange("amount", e.target.value)}
            className="bg-surface-container-low border-none rounded px-2 py-1 text-on-surface text-xs w-20"
            placeholder="Valor"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => onSave(contribution.id)} 
            className="text-primary hover:underline text-xs"
          >
            Guardar
          </button>
          <button 
            onClick={onCancel} 
            className="text-on-surface-variant hover:underline text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }
  
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
      
      <div className="flex items-center gap-2">
        <div className="text-primary font-bold">
          +{formatCurrencyWithSymbol(contribution.amount)}
        </div>
        <button 
          onClick={() => onEdit(contribution.id)} 
          className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
          aria-label={`Editar ${goalName}`}
        >
          <Icon name="edit" size={16} />
        </button>
        <button 
          onClick={() => onDelete(contribution.id)} 
          className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors"
          aria-label={`Apagar ${goalName}`}
        >
          <Icon name="delete" size={16} />
        </button>
      </div>
    </div>
  );
}