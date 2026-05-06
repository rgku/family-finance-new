"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { Icon } from "@/components/Icon";

export default function SavingsPage() {
  const { goals, addGoalContribution } = useData();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedGoalId) {
      setError("Selecione uma meta");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Insira um valor válido");
      return;
    }

    setLoading(true);

    try {
      await addGoalContribution(selectedGoalId, numAmount);
      setSuccess(`Contribuição de ${numAmount.toFixed(2)}€ adicionada à meta "${selectedGoal?.name}"`);
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar contribuição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Poupança</h1>
      <p className="text-slate-400 mb-6">Adicione dinheiro a uma meta de poupança</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Meta
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="mt-3 p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon name={selectedGoal.icon as any || "target"} size={16} className="text-primary" />
                <span className="text-white font-medium">{selectedGoal.name}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((selectedGoal.current_amount / selectedGoal.target_amount) * 100, 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {((selectedGoal.current_amount / selectedGoal.target_amount) * 100).toFixed(1)}% concluído
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Valor (€)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Descrição (opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mais um passo para as férias..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Icon name="refresh_cw" size={18} className="animate-spin" />
              A processar...
            </>
          ) : (
            <>
              <Icon name="plus" size={18} />
              Adicionar Contribuição
            </>
          )}
        </button>
      </form>

      {goals.length === 0 && (
        <div className="mt-8 p-6 bg-slate-800/50 rounded-lg text-center">
          <Icon name="target" size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-400">Ainda não tens metas de poupança</p>
          <a href="/dashboard/goals" className="text-primary hover:underline text-sm mt-2 inline-block">
            Criar primeira meta
          </a>
        </div>
      )}
    </div>
  );
}
