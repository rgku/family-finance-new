"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRecurringTransactions, useDeleteRecurring, useToggleRecurring } from "@/hooks/useRecurringTransactions";
import { RecurringTransactionForm } from "@/components/RecurringTransactionForm";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import { DesktopSidebar, MobileHeader, MobileNav } from "@/components/Sidebar";
import { useDeviceType } from "@/hooks/useDeviceType";
import type { RecurringTransaction } from "@/hooks/useRecurringTransactions";

export default function RecurringPage() {
  const { user, signOut } = useAuth();
  const isMobile = useDeviceType();
  const [showForm, setShowForm] = useState(false);
  const [editingRec, setEditingRec] = useState<RecurringTransaction | null>(null);
  
  const { data: recurring, isLoading } = useRecurringTransactions(user?.id);
  const deleteMutation = useDeleteRecurring();
  const toggleMutation = useToggleRecurring();

  const handleDelete = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta recorrência?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (rec: RecurringTransaction) => {
    setEditingRec(rec);
    setShowForm(true);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleMutation.mutateAsync({ id, enabled: !enabled });
  };

  const getNextRunLabel = (nextRun: string) => {
    const today = new Date();
    const next = new Date(nextRun);
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    return next.toLocaleDateString("pt-PT");
  };

  const pageContent = (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Transações Recorrentes</h1>
          <p className="text-on-surface-variant">Automatiza despesas e receitas repetidas</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:brightness-110 transition-all"
          >
            + Nova Recorrência
          </button>
        )}
      </header>

      {showForm ? (
        <div className="max-w-2xl">
          <div className="mb-6">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingRec(null);
              }}
              className="text-primary hover:underline text-sm"
            >
              ← Voltar
            </button>
          </div>
          <div className="bg-surface-container rounded-2xl p-6">
            <h2 className="text-xl font-bold text-on-surface mb-6">
              {editingRec ? "Editar Transação Recorrente" : "Nova Transação Recorrente"}
            </h2>
            <RecurringTransactionForm
              recurring={editingRec}
              onSuccess={() => {
                setShowForm(false);
                setEditingRec(null);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingRec(null);
              }}
            />
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">
          <p>A carregar...</p>
        </div>
      ) : !recurring || recurring.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="repeat" size={64} className="text-on-surface-variant mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-on-surface mb-2">Sem transações recorrentes</h3>
          <p className="text-on-surface-variant mb-6">
            Automatiza despesas como renda, Netflix, ou salário
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold"
          >
            Criar primeira recorrência
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Recurring */}
          {recurring.filter(r => r.enabled).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Ativas</h2>
              <div className="space-y-4">
                {recurring.filter(r => r.enabled).map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-surface-container rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          rec.type === "income" ? "bg-primary/20" : "bg-tertiary/20"
                        }`}>
                          <Icon
                            name={rec.type === "income" ? "payments" : "shopping_bag"}
                            size={24}
                            className={rec.type === "income" ? "text-primary" : "text-tertiary"}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-on-surface">{rec.description}</h3>
                          <p className="text-sm text-on-surface-variant">{rec.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          rec.type === "income" ? "text-primary" : "text-tertiary"
                        }`}>
                          {rec.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(rec.amount)}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {rec.frequency === "weekly" && "Semanal"}
                          {rec.frequency === "biweekly" && "Quinzenal"}
                          {rec.frequency === "monthly" && "Mensal"}
                          {rec.frequency === "quarterly" && "Trimestral"}
                          {rec.frequency === "yearly" && "Anual"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <Icon name="calendar_today" size={16} />
                          <span>Próxima: {getNextRunLabel(rec.next_run)}</span>
                        </div>
                        {rec.auto_create ? (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Icon name="automation" size={16} />
                            <span>Automático</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <Icon name="notifications" size={16} />
                            <span>Notificar</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(rec)}
                          className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Icon name="edit" size={20} />
                        </button>
                        <button
                          onClick={() => handleToggle(rec.id, rec.enabled)}
                          className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                          title="Pausar"
                        >
                          <Icon name="pause" size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-2 rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors"
                          title="Eliminar"
                        >
                          <Icon name="delete" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inactive Recurring */}
          {recurring.filter(r => !r.enabled).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Inativas</h2>
              <div className="space-y-4">
                {recurring.filter(r => !r.enabled).map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-surface-container rounded-lg p-6 opacity-60"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          rec.type === "income" ? "bg-primary/20" : "bg-tertiary/20"
                        }`}>
                          <Icon
                            name={rec.type === "income" ? "payments" : "shopping_bag"}
                            size={24}
                            className={rec.type === "income" ? "text-primary" : "text-tertiary"}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-on-surface">{rec.description}</h3>
                          <p className="text-sm text-on-surface-variant">{rec.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          rec.type === "income" ? "text-primary" : "text-tertiary"
                        }`}>
                          {rec.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(rec.amount)}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {rec.frequency === "weekly" && "Semanal"}
                          {rec.frequency === "biweekly" && "Quinzenal"}
                          {rec.frequency === "monthly" && "Mensal"}
                          {rec.frequency === "quarterly" && "Trimestral"}
                          {rec.frequency === "yearly" && "Anual"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <Icon name="calendar_today" size={16} />
                          <span>Próxima: {getNextRunLabel(rec.next_run)}</span>
                        </div>
                        {rec.auto_create ? (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Icon name="automation" size={16} />
                            <span>Automático</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <Icon name="notifications" size={16} />
                            <span>Notificar</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(rec)}
                          className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Icon name="edit" size={20} />
                        </button>
                        <button
                          onClick={() => handleToggle(rec.id, rec.enabled)}
                          className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors"
                          title="Ativar"
                        >
                          <Icon name="play_arrow" size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-2 rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors"
                          title="Eliminar"
                        >
                          <Icon name="delete" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        {pageContent}
      </div>
    </div>
  );
}
