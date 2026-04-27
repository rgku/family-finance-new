"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData, type Goal } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol, calculatePercentage } from "@/lib/currency";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

const defaultIcons = [
  "directions_car", "flight", "home", "school", "shopping_bag", 
  "diamond", "celebration", "savings", "sports_esports"
];

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, addGoalContribution } = useData();
  const { signOut } = useAuth();
  const isMobile = useDeviceType();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("savings");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || name.trim().length < 2) {
      showToast("O nome deve ter pelo menos 2 caracteres", "error");
      return;
    }
    
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      showToast("O valor meta deve ser maior que 0", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const newTargetAmount = parseFloat(targetAmount) || 0;
      
      if (editingId) {
        await updateGoal(editingId, {
          name,
          target_amount: newTargetAmount,
          deadline: deadline || undefined,
          icon,
        });
      } else {
        await addGoal({
          name,
          target_amount: newTargetAmount,
          current_amount: 0,
          deadline: deadline || undefined,
          icon,
          goal_type: 'savings',
        });
        showToast("Meta criada com sucesso!", "success");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving goal:", error);
      showToast("Erro ao guardar a meta. Tenta novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setDeadline(goal.deadline || "");
    setIcon(goal.icon);
    setEditingId(goal.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setDeadline("");
    setIcon("savings");
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja excluir esta meta?")) {
      deleteGoal(id);
    }
  };

  const pageContent = (
    <>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Metas de Poupança</h1>
          <p className="text-on-surface-variant">Acompanhe os seus objetivos financeiros</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110"
        >
          {showForm ? "Cancelar" : "+ Nova Meta"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
          <h2 className="font-headline font-bold text-lg mb-4">
            {editingId ? "Editar Meta" : "Nova Meta"}
          </h2>
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              placeholder="Ex: Viagem ao Japão"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Meta (€)</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prazo</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {defaultIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-11 h-11 rounded-xl transition-all border-2 flex items-center justify-center ${
                    icon === ic
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <Icon name={ic} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A guardar..." : editingId ? "Guardar Alterações" : "Criar Meta"}
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

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = calculatePercentage(goal.current_amount, goal.target_amount);
          const remaining = goal.target_amount - goal.current_amount;
          const isCompleted = progress >= 100;
          
          return (
            <div key={goal.id} className="bg-surface-container rounded-lg p-4 flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-3">
                <ProgressRing 
                  progress={progress} 
                  size={48} 
                  strokeWidth={4}
                  color={isCompleted ? "#22c55e" : goal.goal_type === 'savings' ? "#6366f1" : "#f43f5e"}
                  icon={goal.icon}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-headline font-semibold text-sm truncate">{goal.name}</p>
                  <p className="font-label text-xs text-on-surface-variant">
                    {formatCurrencyWithSymbol(goal.current_amount)} / {formatCurrencyWithSymbol(goal.target_amount)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                {goal.deadline && (
                  <div className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Icon name="event" size={12} />
                    <span>{new Date(goal.deadline).toLocaleDateString('pt-PT')}</span>
                  </div>
                )}
                {!isCompleted && remaining > 0 && (
                  <p className="text-xs text-on-surface-variant ml-auto">
                    Faltam {formatCurrencyWithSymbol(remaining)}
                  </p>
                )}
                {isCompleted && (
                  <p className="text-xs text-green-500 ml-auto flex items-center gap-1">
                    <Icon name="check_circle" size={12} />
                    Atingida
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleEdit(goal)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium">
                  <Icon name="edit" size={14} />
                  Editar
                </button>
                <button onClick={() => handleDelete(goal.id)} className="px-2 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium">
                  <Icon name="delete" size={14} />
                </button>
              </div>
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
        <main className="pt-24 px-4 pb-24 space-y-6 max-w-4xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return <div className="p-8 space-y-8">{pageContent}</div>;
}