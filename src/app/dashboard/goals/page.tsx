"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CURRENCY, formatCurrencyWithSymbol } from "@/lib/currency";

export default function GoalsPage() {
  const { supabase, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("savings");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !targetAmount || !supabase) return;
    setLoading(true);
    alert("Meta criada! (Demo mode)");
    setLoading(false);
  };

  const demoGoals = [
    { id: "1", name: "Novo Carro", target_amount: 80000, current_amount: 45000, icon: "directions_car" },
    { id: "2", name: "Viagem Japão", target_amount: 15000, current_amount: 12000, icon: "flight" },
    { id: "3", name: "Férias", target_amount: 3000, current_amount: 1800, icon: "beach_access" },
  ];

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Metas de Poupança</h1>
          <p className="text-on-surface-variant">Acompanhe os seus objetivos financeiros</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110"
        >
          {showForm ? "Cancelar" : "+ Nova Meta"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4">
          <h2 className="font-headline font-bold text-lg mb-4">Nova Meta</h2>
          
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
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Meta ({CURRENCY.symbol})</label>
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
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Atual ({CURRENCY.symbol})</label>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                placeholder="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
          >
            {loading ? "A guardar..." : "Criar Meta"}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {demoGoals.map((goal) => {
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
                <span className="font-headline font-bold text-secondary text-xl">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-on-secondary-container rounded-full transition-all" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}