"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const categories = EXPENSE_CATEGORIES.filter(c => c.value !== "Outros");

export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, deleteBudget } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateBudget(editingId, {
        limit: parseFloat(limitAmount),
      });
    } else {
      addBudget({
        category: selectedCategory,
        limit: parseFloat(limitAmount),
      });
    }
    
    resetForm();
  };

  const handleEdit = (budget: any) => {
    setSelectedCategory(budget.category);
    setLimitAmount(budget.limit.toString());
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja excluir este orçamento?")) {
      deleteBudget(id);
    }
  };

  const resetForm = () => {
    setSelectedCategory("");
    setLimitAmount("");
    setEditingId(null);
    setShowForm(false);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Orçamentos Mensais</h1>
          <p className="text-on-surface-variant">Controle os seus gastos por categoria</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110"
        >
          {showForm ? "Cancelar" : "+ Novo Orçamento"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
          <h2 className="font-headline font-bold text-lg mb-4">
            {editingId ? "Editar Orçamento" : "Novo Orçamento"}
          </h2>
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
            <div className="grid grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    selectedCategory === cat.value
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined">{cat.icon}</span>
                  <span className="text-[10px] font-medium">{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Limite Mensal (€)</label>
            <input
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              placeholder="500"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
            >
              {editingId ? "Guardar Alterações" : "Criar Orçamento"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 bg-surface-container-high text-on-surface font-bold rounded-full"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container rounded-lg p-5 text-center">
          <p className="text-xs text-on-surface-variant">Total Orçamento</p>
          <p className="font-headline text-3xl font-bold text-on-surface mt-1">
            {formatCurrencyWithSymbol(totalBudget)}
          </p>
        </div>
        <div className="bg-surface-container rounded-lg p-5 text-center">
          <p className="text-xs text-on-surface-variant">Total Gasto</p>
          <p className="font-headline text-3xl font-bold text-tertiary mt-1">
            {formatCurrencyWithSymbol(totalSpent)}
          </p>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {budgets.map((budget) => {
          const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
          const isOver = percentage >= 100;
          const isWarning = percentage >= 80 && percentage < 100;
          
          const categoryIcon = categories.find(c => c.value === budget.category)?.icon || "help";
          
          return (
            <div 
              key={budget.id}
              className={`bg-surface-container rounded-lg p-5 ${isOver ? "border border-error/50" : ""}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${isOver ? "text-error" : isWarning ? "text-tertiary" : "text-primary"}`}>
                    {categoryIcon}
                  </span>
                  <div>
                    <p className="font-semibold">{budget.category}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatCurrencyWithSymbol(budget.spent)} de {formatCurrencyWithSymbol(budget.limit)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(budget)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium">
                    <span className="material-symbols-outlined text-base">edit</span>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(budget.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium">
                    <span className="material-symbols-outlined text-base">delete</span>
                    Apagar
                  </button>
                </div>
              </div>
              
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${isOver ? "bg-error" : isWarning ? "bg-tertiary" : "bg-primary"}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-on-surface-variant mt-2 text-right">
                {Math.round(percentage)}% usado
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}