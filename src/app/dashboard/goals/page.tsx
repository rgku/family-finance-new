"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

const defaultIcons = [
  "directions_car", "flight", "home", "school", "shopping_bag", 
  "diamond", "celebration", "savings", "sports_esports"
];

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("savings");
  const [goalType, setGoalType] = useState<'savings' | 'expense'>('savings');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateGoal(editingId, {
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || undefined,
        icon,
        goal_type: goalType,
      });
    } else {
      addGoal({
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || undefined,
        icon,
        goal_type: goalType,
      });
    }
    
    resetForm();
  };

  const handleEdit = (goal: any) => {
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setDeadline(goal.deadline || "");
    setIcon(goal.icon);
    setGoalType(goal.goal_type || 'savings');
    setEditingId(goal.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setIcon("savings");
    setGoalType('savings');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (goal: any) => {
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setDeadline(goal.deadline || "");
    setIcon(goal.icon);
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja excluir esta meta?")) {
      deleteGoal(id);
    }
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setIcon("savings");
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-8 space-y-6">
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
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Atual (€)</label>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                placeholder="0"
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
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tipo de Meta</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoalType('savings')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-all ${
                  goalType === 'savings'
                    ? "bg-secondary/20 text-secondary border border-secondary"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined">savings</span>
                <span className="font-medium">Poupança</span>
              </button>
              <button
                type="button"
                onClick={() => setGoalType('expense')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-all ${
                  goalType === 'expense'
                    ? "bg-tertiary/20 text-tertiary border border-tertiary"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined">payments</span>
                <span className="font-medium">Despesa</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {goalType === 'savings' ? 'Valor será subtraído do saldo disponível' : 'Valor será incluído nos gráficos de despesas'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ícone</label>
            <div className="grid grid-cols-5 gap-2">
              {defaultIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-3 rounded-xl transition-all ${
                    icon === ic ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
            >
              {editingId ? "Guardar Alterações" : "Criar Meta"}
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

      <div className="grid gap-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
          return (
            <div key={goal.id} className="bg-surface-container rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">{goal.icon}</span>
                  </div>
                  <div>
                    <p className="font-headline font-semibold text-lg">{goal.name}</p>
                    <p className="font-label text-xs text-on-surface-variant">
                      {formatCurrencyWithSymbol(goal.current_amount)} de {formatCurrencyWithSymbol(goal.target_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(goal)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium">
                    <span className="material-symbols-outlined text-base">edit</span>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium">
                    <span className="material-symbols-outlined text-base">delete</span>
                    Apagar
                  </button>
                </div>
              </div>
              <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-on-secondary-container rounded-full transition-all" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-on-surface-variant">{Math.round(progress)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}