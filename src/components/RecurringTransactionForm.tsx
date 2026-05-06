"use client";

import { useState, useEffect } from "react";
import { useCreateRecurring, useUpdateRecurring, RecurringTransaction } from "@/hooks/useRecurringTransactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { Icon } from "@/components/Icon";

interface RecurringTransactionFormProps {
  recurring?: RecurringTransaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecurringTransactionForm({ recurring, onSuccess, onCancel }: RecurringTransactionFormProps) {
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const isEditing = !!recurring;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense",
    frequency: "monthly" as RecurringTransaction["frequency"],
    start_date: new Date().toISOString().split("T")[0],
    day_of_month: new Date().getDate(),
    auto_create: true,
  });

  useEffect(() => {
    if (recurring) {
      setFormData({
        description: recurring.description,
        amount: recurring.amount.toString(),
        category: recurring.category,
        type: recurring.type,
        frequency: recurring.frequency,
        start_date: recurring.start_date,
        day_of_month: recurring.day_of_month || new Date().getDate(),
        auto_create: recurring.auto_create,
      });
    }
  }, [recurring]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && recurring) {
        await updateMutation.mutateAsync({
          id: recurring.id,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          type: formData.type,
          frequency: formData.frequency,
          start_date: formData.start_date,
          day_of_month: formData.frequency === "monthly" ? formData.day_of_month : undefined,
          auto_create: formData.auto_create,
        });
      } else {
        await createMutation.mutateAsync({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          type: formData.type,
          frequency: formData.frequency,
          start_date: formData.start_date,
          day_of_month: formData.frequency === "monthly" ? formData.day_of_month : undefined,
          auto_create: formData.auto_create,
          enabled: true,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving recurring transaction:", error);
      alert("Erro ao guardar transação recorrente. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Descrição
        </label>
        <input
          id="description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Ex: Netflix, Renda, Ginásio"
          required
        />
      </div>

      {/* Amount and Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Valor
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Tipo
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Categoria
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.value}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div>
        <label htmlFor="frequency" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Frequência
        </label>
        <select
          id="frequency"
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="weekly">Semanal (toda semana)</option>
          <option value="biweekly">Quinzenal (a cada 2 semanas)</option>
          <option value="monthly">Mensal (todo mês)</option>
          <option value="quarterly">Trimestral (a cada 3 meses)</option>
          <option value="yearly">Anual (todo ano)</option>
        </select>
      </div>

      {/* Day of Month (for monthly) */}
      {formData.frequency === "monthly" && (
        <div>
          <label htmlFor="day_of_month" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Dia do mês (1-28)
          </label>
          <select
            id="day_of_month"
            value={formData.day_of_month}
            onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Dia {day}
              </option>
            ))}
          </select>
          <p className="text-xs text-on-surface-variant mt-2">
            Usamos dias 1-28 para evitar problemas em meses com menos dias
          </p>
        </div>
      )}

      {/* Start Date */}
      <div>
        <label htmlFor="start_date" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Data de início
        </label>
        <input
          id="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
          required
        />
      </div>

      {/* Auto-create toggle */}
      <div className="bg-surface-container-low rounded-2xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.auto_create}
            onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-surface-container-high text-primary focus:ring-primary/20"
          />
          <div className="flex-1">
            <p className="font-semibold text-on-surface">Criar automaticamente</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {formData.auto_create
                ? "A transação será criada automaticamente no dia definido. Não precisas fazer nada."
                : "Receberás uma notificação para criar manualmente a transação no dia."}
            </p>
          </div>
          <Icon
            name={formData.auto_create ? "check_circle" : "info"}
            size={24}
            className={formData.auto_create ? "text-primary" : "text-on-surface-variant"}
          />
        </label>
      </div>

      {/* Submit buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-surface-container text-on-surface font-bold rounded-full hover:brightness-110 transition-all"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || createMutation.isPending || updateMutation.isPending}
          className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? (isEditing ? "A editar..." : "A criar...") : (isEditing ? "Editar Recorrência" : "Criar Recorrência")}
        </button>
      </div>
    </form>
  );
}
