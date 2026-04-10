"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { transactions, goals, budgets, loading } = useData();

  const { totalIncome, totalExpenses } = useMemo(() => {
    const inc = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: inc, totalExpenses: exp };
  }, [transactions]);

  const firstName = useMemo(() => user?.email?.split('@')[0] || 'Utilizador', [user?.email]);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface">Perfil</h1>
        <p className="text-on-surface-variant">Informações da tua conta</p>
      </header>

      {/* Profile Card */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface capitalize">{firstName}</h2>
            <p className="text-sm text-on-surface-variant">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-lg text-on-surface">Resumo Financeiro</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant">Total Receitas</p>
            <p className="text-xl font-bold text-primary">{formatCurrencyWithSymbol(totalIncome)}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant">Total Despesas</p>
            <p className="text-xl font-bold text-tertiary">{formatCurrencyWithSymbol(totalExpenses)}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant">Transações</p>
            <p className="text-xl font-bold text-on-surface">{transactions.length}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-xs text-on-surface-variant">Metas Ativas</p>
            <p className="text-xl font-bold text-on-surface">{goals.length}</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-lg text-on-surface">Informações da Conta</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-surface-container-high">
            <span className="text-on-surface-variant">Email</span>
            <span className="text-on-surface">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-container-high">
            <span className="text-on-surface-variant">Membro desde</span>
            <span className="text-on-surface">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-PT') : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-container-high">
            <span className="text-on-surface-variant">Estado</span>
            <span className="text-primary font-medium">Ativo</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => signOut()}
        className="w-full py-4 bg-error/10 text-error font-bold rounded-lg hover:bg-error/20 transition-colors"
      >
        Terminar Sessão
      </button>
    </div>
  );
}