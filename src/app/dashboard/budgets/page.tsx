"use client";

import { useState } from "react";
import { useData, type Budget } from "@/hooks/DataProvider";
import { useAuth } from "@/components/AuthProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { formatCustomMonth } from "@/lib/dateUtils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Icon } from "@/components/Icon";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { AIBudgetSuggestion } from "@/lib/ai/types";
import { useToast } from "@/components/Toast";

const categories = EXPENSE_CATEGORIES.filter(c => c.value !== "Outros");

export default function BudgetsPage() {
  const { budgets, setCurrentBudgetMonth, addBudget, updateBudget, deleteBudget } = useData();
  const { profile, signOut } = useAuth();
  const isMobile = useDeviceType();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const billingDay = profile?.billing_cycle_day || 1;
  const displayMonth = profile?.billing_cycle_day && profile.billing_cycle_day > 1
    ? formatCustomMonth(billingDay, new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1))
    : (() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return `${monthNames[m - 1]} ${y}`;
      })();

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setCurrentBudgetMonth(month);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      showToast("Seleciona uma categoria", "error");
      return;
    }
    
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      showToast("O limite deve ser maior que 0", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingId) {
        await updateBudget(editingId, {
          limit: parseFloat(limitAmount),
        });
        showToast("Orçamento atualizado!", "success");
      } else {
        await addBudget({
          category: selectedCategory,
          limit: parseFloat(limitAmount),
        });
        showToast("Orçamento criado com sucesso!", "success");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving budget:", error);
      showToast("Erro ao guardar o orçamento. Tenta novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
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

  const handleAIOptimize = async (forceRefresh = false) => {
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const res = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh }),
      });
      if (!res.ok) throw new Error("Erro ao gerar sugestões");
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
      setAiSummary(data.summary || "");
    } catch {
      setAiSuggestions([]);
      setAiSummary("Erro ao gerar sugestões. Tenta novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: AIBudgetSuggestion) => {
    const existingBudget = budgets.find(b => b.category === suggestion.category);
    if (existingBudget) {
      updateBudget(existingBudget.id, { limit: suggestion.suggestedLimit });
    } else {
      addBudget({ category: suggestion.category, limit: suggestion.suggestedLimit });
    }
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const [aiSuggestions, setAiSuggestions] = useState<AIBudgetSuggestion[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const pageContent = (
    <>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Orçamentos Mensais</h1>
          <p className="text-on-surface-variant">Controle os seus gastos por categoria</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAIOptimize(false)}
            className="px-4 py-3 bg-secondary text-on-secondary rounded-full font-bold hover:brightness-110 flex items-center gap-2 transition-all"
          >
            <Icon name="sparkles" size={18} />
            <span className="hidden sm:inline">Otimizar com IA</span>
            <span className="sm:hidden">IA</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110"
          >
            {showForm ? "Cancelar" : "+ Novo Orçamento"}
          </button>
        </div>
      </header>

      <div className="flex items-center gap-4 py-3 bg-surface-container rounded-lg px-4">
        <span className="text-sm font-medium text-on-surface-variant">Período:</span>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-medium"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
          <h2 className="font-headline font-bold text-lg mb-4">
            {editingId ? "Editar Orçamento" : "Novo Orçamento"}
          </h2>
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-all min-h-[56px] ${
                    selectedCategory === cat.value
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                  aria-label={`Selecionar ${cat.value}`}
                >
                  <Icon name={cat.icon} size={20} />
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
              disabled={loading}
              className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A guardar..." : editingId ? "Guardar Alterações" : "Criar Orçamento"}
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

      {/* AI Suggestions Panel */}
      {showAiPanel && (
        <div className="bg-gradient-to-br from-secondary/10 to-secondary-container/20 rounded-lg p-6 border border-secondary/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Icon name="sparkles" size={20} className="text-secondary" />
              Sugestões da IA
            </h3>
            <button
              onClick={() => setShowAiPanel(false)}
              className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {aiLoading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-on-surface-variant text-sm">A analisar os teus orçamentos...</span>
            </div>
          ) : aiSuggestions.length > 0 ? (
            <>
              {aiSummary && (
                <p className="text-sm text-on-surface-variant italic border-l-2 border-secondary pl-3">{aiSummary}</p>
              )}
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-surface-container rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{suggestion.category}</span>
                          <span className="text-xs text-on-surface-variant">
                            {formatCurrencyWithSymbol(suggestion.currentLimit)} → {formatCurrencyWithSymbol(suggestion.suggestedLimit)}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{suggestion.reason}</p>
                        {suggestion.impactOnGoals && (
                          <p className="text-xs text-secondary mt-1">Impacto: {suggestion.impactOnGoals}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="px-3 py-1.5 bg-secondary text-on-secondary font-bold rounded-full text-sm hover:brightness-110 shrink-0 transition-all"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleAIOptimize(true)}
                  className="text-xs text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1"
                >
                  <Icon name="refresh" size={14} />
                  Regenerar
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-on-surface-variant">{aiSummary || "Sem sugestões disponíveis."}</p>
              <button
                onClick={() => handleAIOptimize(true)}
                className="mt-2 text-xs text-secondary hover:underline flex items-center gap-1 mx-auto"
              >
                <Icon name="refresh" size={14} />
                Regenerar
              </button>
            </div>
          )}
        </div>
      )}

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
                  <Icon name={categoryIcon} size={20} className={isOver ? "text-error" : isWarning ? "text-tertiary" : "text-primary"} />
                  <div>
                    <p className="font-semibold">{budget.category}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatCurrencyWithSymbol(budget.spent)} de {formatCurrencyWithSymbol(budget.limit)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(budget)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium">
                    <Icon name="edit" size={16} className="text-base" />
                    Editar
                  </button>
                  <button onClick={() => handleDelete(budget.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium">
                    <Icon name="delete" size={16} className="text-base" />
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
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-24 px-4 pb-24 space-y-6 max-w-2xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return <div className="p-8 pb-24 md:pb-8 space-y-6">{pageContent}</div>;
}