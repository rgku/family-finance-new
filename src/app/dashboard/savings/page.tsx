"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { useAuth } from "@/components/AuthProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

export default function SavingsPage() {
  const { goals, addGoalContribution } = useData();
  const { signOut } = useAuth();
  const isMobile = useDeviceType();
  const { showToast } = useToast();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGoalId) {
      showToast("Selecione uma meta", "error");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Insira um valor válido", "error");
      return;
    }

    setLoading(true);

    try {
      await addGoalContribution(selectedGoalId, numAmount);
      showToast(`Contribuição de ${numAmount.toFixed(2)}€ adicionada!`, "success");
      setAmount("");
      setDescription("");
      setSelectedGoalId("");
    } catch (err: any) {
      showToast(err.message || "Erro ao adicionar contribuição", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobile && <MobileHeader onSignOut={signOut} />}
      
      <main className={`${isMobile ? "pb-20 pt-4" : "p-8"} max-w-2xl mx-auto space-y-8`}>
        <header className="px-4 md:px-0">
          <h1 className="text-3xl font-bold text-on-surface">Poupança</h1>
          <p className="text-on-surface-variant">Adicione dinheiro a uma meta de poupança</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 px-4 md:px-0">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Meta
            </label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
              required
            >
              <option value="">Selecione uma meta</option>
              {goals
                .filter(g => {
                  const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                  return progress < 100;
                })
                .map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name} ({goal.current_amount.toFixed(0)}€ / {goal.target_amount.toFixed(0)}€)
                  </option>
                ))}
            </select>

            {selectedGoal && (
              <div className="mt-3 bg-surface-container rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Icon name={selectedGoal.icon as any || "target"} size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{selectedGoal.name}</h3>
                    <p className="text-sm text-on-surface-variant">
                      {selectedGoal.current_amount.toFixed(0)}€ / {selectedGoal.target_amount.toFixed(0)}€
                    </p>
                  </div>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min((selectedGoal.current_amount / selectedGoal.target_amount) * 100, 100)}%`
                    }}
                  />
                </div>
                <p className="text-sm text-on-surface-variant">
                  {((selectedGoal.current_amount / selectedGoal.target_amount) * 100).toFixed(1)}% concluído
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Valor (€)
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 text-on-surface"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface [color-scheme:dark]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mais um passo para as férias..."
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-700 text-on-primary font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="refresh_cw" size={20} className="animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <Icon name="plus" size={20} />
                Adicionar Contribuição
              </>
            )}
          </button>
        </form>

        {goals.length === 0 && (
          <div className="bg-surface-container rounded-lg p-8 text-center px-4 md:px-0">
            <Icon name="target" size={40} className="mx-auto mb-4 text-on-surface-variant" />
            <p className="text-on-surface-variant mb-4">Ainda não tens metas de poupança</p>
            <a href="/dashboard/goals" className="text-primary hover:underline font-medium">
              Criar primeira meta
            </a>
          </div>
        )}
      </main>

      {isMobile && <MobileNav />}
    </div>
  );
}
