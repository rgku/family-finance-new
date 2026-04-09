"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY, formatCurrencyWithSymbol } from "@/lib/currency";

export default function BudgetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Orçamento criado com sucesso! (Modo demonstração)");
    setSelectedCategory("");
    setLimitAmount("");
    setShowForm(false);
  };

  const categories = [
    { value: "Moradia", icon: "home" },
    { value: "Alimentação", icon: "restaurant" },
    { value: "Transporte", icon: "directions_car" },
    { value: "Lazer", icon: "movie" },
    { value: "Saúde", icon: "local_hospital" },
  ];

  const demoBudgets = [
    { category: "Alimentação", limit: 800, spent: 650, icon: "restaurant" },
    { category: "Moradia", limit: 1200, spent: 1200, icon: "home" },
    { category: "Transporte", limit: 300, spent: 180, icon: "directions_car" },
    { category: "Lazer", limit: 200, spent: 95, icon: "movie" },
  ];

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Orçamentos Mensais</h1>
          <p className="text-on-surface-variant">Controle os seus gastos por categoria</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110"
        >
          {showForm ? "Cancelar" : "+ Novo Orçamento"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
          <h2 className="font-headline font-bold text-lg mb-4">Novo Orçamento</h2>
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
            <div className="grid grid-cols-5 gap-2">
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
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Limite Mensal ({CURRENCY.symbol})</label>
            <input
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              placeholder="500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
          >
            Criar Orçamento
          </button>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container rounded-lg p-5 text-center">
          <p className="text-xs text-on-surface-variant">Total Orçamento</p>
          <p className="font-headline text-3xl font-bold text-on-surface mt-1">
            {formatCurrencyWithSymbol(demoBudgets.reduce((sum, b) => sum + b.limit, 0))}
          </p>
        </div>
        <div className="bg-surface-container rounded-lg p-5 text-center">
          <p className="text-xs text-on-surface-variant">Total Gasto</p>
          <p className="font-headline text-3xl font-bold text-tertiary mt-1">
            {formatCurrencyWithSymbol(demoBudgets.reduce((sum, b) => sum + b.spent, 0))}
          </p>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {demoBudgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const isOver = percentage >= 100;
          const isWarning = percentage >= 80 && percentage < 100;
          
          return (
            <div 
              key={budget.category}
              className={`bg-surface-container rounded-lg p-5 ${isOver ? "border border-error/50" : ""}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${isOver ? "text-error" : isWarning ? "text-tertiary" : "text-primary"}`}>
                    {budget.icon}
                  </span>
                  <div>
                    <p className="font-semibold">{budget.category}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatCurrencyWithSymbol(budget.spent)} de {formatCurrencyWithSymbol(budget.limit)}
                    </p>
                  </div>
                </div>
                {isOver && (
                  <span className="px-3 py-1 bg-error/20 text-error text-xs font-bold rounded-full">
                    Excedido
                  </span>
                )}
                {isWarning && !isOver && (
                  <span className="px-3 py-1 bg-tertiary/20 text-tertiary text-xs font-bold rounded-full">
                    Quase limite
                  </span>
                )}
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