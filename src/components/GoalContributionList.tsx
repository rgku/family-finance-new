"use client";

import { useMemo } from "react";
import { GoalContributionCard } from "./GoalContributionCard";
import type { GoalContribution } from "@/hooks/useGoalContributions";

interface GoalContributionListProps {
  contributions: GoalContribution[];
  editingId: string | null;
  editForm: { amount: string; date: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFormChange: (field: string, value: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}

export function GoalContributionList({
  contributions,
  editingId,
  editForm,
  onEdit,
  onDelete,
  onFormChange,
  onSave,
  onCancel,
}: GoalContributionListProps) {
  const groupedContributions = useMemo(() => {
    const groups: Record<string, GoalContribution[]> = {};
    
    contributions.forEach((contribution) => {
      const dateKey = contribution.contribution_date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(contribution);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
      }));
  }, [contributions]);

  const handleEdit = (id: string) => {
    const contrib = contributions.find(c => c.id === id);
    if (!contrib) return;
    onEdit(id);
    onFormChange("amount", contrib.amount.toString());
    onFormChange("date", contrib.contribution_date);
  };

  if (contributions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-on-surface-variant">Sem contribuições às metas ainda.</p>
        <a 
          href="/dashboard/goal-contribution/new" 
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Adicionar contribuição →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedContributions.map(({ date, items }) => (
        <div key={date}>
          <p className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">
            {new Date(date).toLocaleDateString("pt-PT", { 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <div className="space-y-2">
            {items.map((contribution) => (
              <GoalContributionCard
                key={contribution.id}
                contribution={contribution}
                isEditing={editingId === contribution.id}
                editForm={editForm}
                onEdit={handleEdit}
                onDelete={onDelete}
                onFormChange={onFormChange}
                onSave={onSave}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}