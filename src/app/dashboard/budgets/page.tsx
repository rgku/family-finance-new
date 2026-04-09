"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY, formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";

const categories = [
  { value: "Moradia", icon: "home" },
  { value: "Alimentação", icon: "restaurant" },
  { value: "Transporte", icon: "directions_car" },
  { value: "Lazer", icon: "movie" },
  { value: "Saúde", icon: "local_hospital" },
  { value: "Educação", icon: "school" },
];

// Sample budgets for demo
const sampleBudgets = [
  { category: "Alimentação", limit: 1500, spent: 1250, status: "warning" },
  { category: "Moradia", limit: 2000, spent: 2000, status: "danger" },
  { category: "Transporte", limit: 500, spent: 280, status: "ok" },
  { category: "Lazer", limit: 300, spent: 150, status: "ok" },
  { category: "Saúde", limit: 400, spent: 380, status: "warning" },
];

export default function BudgetsPage() {
  const { supabase, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Orçamento criado! (Demo mode)");
    setShowForm(false);
    setSelectedCategory("");
    setLimitAmount("");
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline font-bold text-lg text-on-surface">Orçamentos</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-primary">{showForm ? "close" : "add"}</span>
        </button>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-6">
        {/* Create Budget Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
            <h2 className="font-headline font-bold text-lg mb-4">Novo Orçamento</h2>
            
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      selectedCategory === cat.value
                        ? "bg-primary/20 text-primary border border-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
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
                placeholder="1000"
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

        {/* Budget Overview */}
        <div className="bg-surface-container rounded-lg p-5">
          <h3 className="font-headline font-bold text-lg mb-4">Resumo do Mês</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant">Total Orçamento</p>
              <p className="font-headline text-2xl font-bold text-on-surface mt-1">
                {formatCurrencyWithSymbol(sampleBudgets.reduce((sum, b) => sum + b.limit, 0))}
              </p>
            </div>
            <div className="text-center p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant">Total Gasto</p>
              <p className="font-headline text-2xl font-bold text-tertiary mt-1">
                {formatCurrencyWithSymbol(sampleBudgets.reduce((sum, b) => sum + b.spent, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Budget List with Alerts */}
        <div className="space-y-3">
          <h3 className="font-headline font-bold text-lg">Categorias</h3>
          {sampleBudgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100;
            const isOverLimit = percentage >= 100;
            const isWarning = percentage >= 80 && percentage < 100;
            
            return (
              <div 
                key={budget.category} 
                className={`bg-surface-container rounded-lg p-4 ${
                  isOverLimit ? "border border-error/50" : isWarning ? "border border-warning/50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isOverLimit ? "bg-error/20 text-error" : 
                      isWarning ? "bg-tertiary/20 text-tertiary" : 
                      "bg-primary/20 text-primary"
                    }`}>
                      <span className="material-symbols-outlined">
                        {budget.category === "Alimentação" ? "restaurant" :
                         budget.category === "Moradia" ? "home" :
                         budget.category === "Transporte" ? "directions_car" :
                         budget.category === "Lazer" ? "movie" : "medical_services"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{budget.category}</p>
                      <p className="text-xs text-on-surface-variant">
                        {formatCurrencyWithSymbol(budget.spent)} de {formatCurrencyWithSymbol(budget.limit)}
                      </p>
                    </div>
                  </div>
                  {isOverLimit && (
                    <span className="px-2 py-1 bg-error/20 text-error text-xs font-bold rounded-full">
                      Excedido
                    </span>
                  )}
                  {isWarning && !isOverLimit && (
                    <span className="px-2 py-1 bg-tertiary/20 text-tertiary text-xs font-bold rounded-full">
                      Quase limite
                    </span>
                  )}
                </div>
                
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isOverLimit ? "bg-error" : isWarning ? "bg-tertiary" : "bg-primary"
                    }`}
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
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Home</span>
        </Link>
        <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Add</span>
        </Link>
        <Link href="/dashboard/goals" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">track_changes</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Metas</span>
        </Link>
      </nav>
    </div>
  );
}