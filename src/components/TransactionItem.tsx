"use client";

import { memo } from "react";
import { Icon } from "@/components/Icon";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

export const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  .map(c => c.value)
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => {
    if (a === "Outros") return 1;
    if (b === "Outros") return -1;
    return a.localeCompare(b);
  });

interface TransactionItemProps {
  transaction: {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editForm: {
    description: string;
    amount: string;
    type: "income" | "expense";
    category: string;
    date: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  isEditing,
  editForm,
  onFormChange,
  onSave,
  onCancel,
}: TransactionItemProps) {
  if (isEditing) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={editForm.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full text-sm"
          placeholder="Descrição"
        />
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={editForm.date}
            onChange={(e) => onFormChange("date", e.target.value)}
            className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
          />
          <select
            value={editForm.category}
            onChange={(e) => onFormChange("category", e.target.value)}
            className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
          >
            <option value="">Selecionar categoria</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            value={editForm.amount}
            onChange={(e) => onFormChange("amount", e.target.value)}
            className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
            placeholder="Valor"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onCancel} className="text-on-surface-variant text-sm px-3 py-1.5">Cancelar</button>
          <button onClick={() => onSave(transaction.id)} className="text-primary text-sm font-medium px-3 py-1.5">Guardar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon name={transaction.type === "income" ? "payments" : "shopping_bag"} size={20} className="text-on-surface-variant" />
        <div>
          <p className="font-medium text-on-surface">{transaction.description}</p>
          <p className="text-xs text-on-surface-variant">{transaction.category} • {new Date(transaction.date).toLocaleDateString("pt-PT")}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${transaction.type === "income" ? "text-primary" : "text-tertiary"}`}>
          {transaction.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(transaction.amount)}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(transaction.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors" aria-label="Editar">
            <Icon name="edit" size={16} className="text-base" />
          </button>
          <button onClick={() => onDelete(transaction.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors" aria-label="Apagar">
            <Icon name="delete" size={16} className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.transaction.id === next.transaction.id &&
    prev.transaction.amount === next.transaction.amount &&
    prev.transaction.description === next.transaction.description &&
    prev.isEditing === next.isEditing
  );
});
