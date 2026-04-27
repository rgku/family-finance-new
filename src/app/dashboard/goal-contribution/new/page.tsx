"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/hooks/DataProvider";
import { useAuth } from "@/components/AuthProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { CURRENCY } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

const GOAL_ICONS = [
  "directions_car", "flight", "home", "school", "shopping_bag", 
  "diamond", "celebration", "savings", "sports_esports"
];

function GoalContributionForm() {
  const { goals, addGoalContribution } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { signOut } = useAuth();
  const isMobile = useDeviceType();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [goalId, setGoalId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const activeGoals = goals.filter(g => g.goal_type === 'savings');

  console.log('Goals from DataProvider:', goals);
  console.log('Active savings goals:', activeGoals);

  useEffect(() => {
    const goalIdParam = searchParams.get("goal");
    if (goalIdParam) {
      console.log('Setting goal from URL:', goalIdParam);
      setGoalId(goalIdParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError("O valor deve ser maior que zero");
      showToast("O valor deve ser maior que zero", "error");
      return;
    }
    
    if (!goalId) {
      setError("Selecione uma meta");
      showToast("Selecione uma meta", "error");
      return;
    }

    setLoading(true);
    setError("");
    
    console.log('Adding contribution:', { goalId, amount: amountNum, original: amount });
    
    try {
      await addGoalContribution(goalId, amountNum);
      
      showToast("Contribuição adicionada com sucesso!", "success");
      
      setTimeout(() => {
        router.push("/dashboard/goals");
      }, 1000);
    } catch (err) {
      setError("Erro ao adicionar contribuição");
      showToast("Erro ao adicionar contribuição. Tenta novamente.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container-low rounded-3xl p-4 sm:p-6">
      <div>
        <label htmlFor="goal" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Meta
        </label>
        {activeGoals.length === 0 ? (
          <div className="bg-surface-container-low rounded-2xl p-4 text-center">
            <p className="text-on-surface-variant mb-2">Não tem metas de poupança ativas.</p>
            <a href="/dashboard/goals" className="text-primary hover:underline text-sm">
              Criar uma meta →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => setGoalId(goal.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  goalId === goal.id
                    ? "bg-primary/20 text-primary border border-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon name={goal.icon || 'savings'} size={24} className="text-lg" />
                <div className="text-center">
                  <span className="text-xs font-medium block">{goal.name}</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {goal.current_amount}€ / {goal.target_amount}€
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Valor ({CURRENCY.symbol})
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
            {CURRENCY.symbol}
          </span>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="0,00"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Data
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Descrição (opcional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Ex: Mais um passo para as férias..."
        />
      </div>

      {error && (
        <p className="text-error text-sm text-center" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || activeGoals.length === 0}
        className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? "A guardar..." : "Adicionar Contribuição"}
      </button>
    </form>
  );
}

export default function NewGoalContribution() {
  const { signOut } = useAuth();
  const isMobile = useDeviceType();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <div className="pt-20 px-4 pb-24 space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-on-surface">Nova Contribuição</h1>
            <p className="text-on-surface-variant text-sm">Adicione dinheiro a uma meta</p>
          </header>

          <Suspense fallback={<div className="text-center py-8">A carregar...</div>}>
            <GoalContributionForm />
          </Suspense>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Nova Contribuição</h1>
        <p className="text-on-surface-variant">Adicione dinheiro a uma meta de poupança</p>
      </header>

      <Suspense fallback={<div className="text-center py-8">A carregar...</div>}>
        <GoalContributionForm />
      </Suspense>
    </div>
  );
}