"use client";

import { useState, useMemo } from "react";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export default function AlertsPage() {
  const { alerts, loading, createAlert, updateAlert, deleteAlert, toggleAlert } = useBudgetAlerts();
  
  const [isCreating, setIsCreating] = useState(false);
  const [alertForm, setAlertForm] = useState({
    category: "",
    threshold: 80,
    alertType: "warning" as "warning" | "exceeded",
    notifyEmail: true,
    notifyInApp: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const activeAlerts = useMemo(() => alerts.filter(a => a.is_active), [alerts]);
  const inactiveAlerts = useMemo(() => alerts.filter(a => !a.is_active), [alerts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.category) return;
    
    setSubmitting(true);
    setMessage("");
    
    try {
      await createAlert(
        alertForm.category,
        alertForm.threshold,
        alertForm.alertType,
        alertForm.notifyEmail,
        alertForm.notifyInApp
      );
      setMessage("Alerta criado com sucesso!");
      setAlertForm({
        category: "",
        threshold: 80,
        alertType: "warning",
        notifyEmail: true,
        notifyInApp: true,
      });
      setIsCreating(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (confirm("Eliminar este alerta?")) {
      try {
        await deleteAlert(alertId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setMessage(errorMessage);
      }
    }
  };

  const handleToggle = async (alertId: string, currentStatus: boolean) => {
    try {
      await toggleAlert(alertId, !currentStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    }
  };

  const categories = EXPENSE_CATEGORIES.map(c => c.value);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          ← Voltar ao Dashboard
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Alertas de Orçamento</h1>
        <p className="text-on-surface-variant">Receba notificações quando approaching do limite</p>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('sucesso') ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium"
        >
          + Criar Alerta
        </button>
        <span className="text-sm text-on-surface-variant">
          {alerts.length} alerta(s) ativo(s)
        </span>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-surface-container rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Novo Alerta</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                Categoria
              </label>
              <select
                value={alertForm.category}
                onChange={(e) => setAlertForm({ ...alertForm, category: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                required
              >
                <option value="">Selecionar categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                Avisar quando usares: {alertForm.threshold}% do orçamento
              </label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={alertForm.threshold}
                onChange={(e) => setAlertForm({ ...alertForm, threshold: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>50%</span>
                <span>{alertForm.threshold}%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                Tipo de alerta
              </label>
              <select
                value={alertForm.alertType}
                onChange={(e) => setAlertForm({ ...alertForm, alertType: e.target.value as "warning" | "exceeded" })}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
              >
                <option value="warning">Aviso (approaching limite)</option>
                <option value="exceeded">Excedido (já passou)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={alertForm.notifyEmail}
                  onChange={(e) => setAlertForm({ ...alertForm, notifyEmail: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-on-surface">Notificação por email</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={alertForm.notifyInApp}
                  onChange={(e) => setAlertForm({ ...alertForm, notifyInApp: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-on-surface">Notificação in-app</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-primary text-on-primary rounded-full font-medium disabled:opacity-50"
            >
              {submitting ? "A criar..." : "Criar Alerta"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-surface-container rounded-lg">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">notifications_off</span>
            <p className="mt-4 text-on-surface-variant">Nenhum alerta configurado</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-primary hover:underline mt-2"
            >
              Criar primeiro alerta
            </button>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-surface-container rounded-lg p-4 flex items-center justify-between ${
                !alert.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.alert_type === "warning" ? "bg-yellow-500/20" : "bg-error/20"
                }`}>
                  <span className={`material-symbols-outlined ${
                    alert.alert_type === "warning" ? "text-yellow-400" : "text-error"
                  }`}>
                    {alert.alert_type === "warning" ? "warning" : "error"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-on-surface">{alert.category}</p>
                  <p className="text-sm text-on-surface-variant">
                    {alert.alert_type === "warning" 
                      ? `Avisa quando passar ${alert.threshold_percent}%` 
                      : "Avisa quando exceder"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {alert.notify_email && (
                  <span className="material-symbols-outlined text-on-surface-variant text-sm" title="Email enabled">
                    email
                  </span>
                )}
                {alert.notify_in_app && (
                  <span className="material-symbols-outlined text-on-surface-variant text-sm" title="In-app enabled">
                    notifications
                  </span>
                )}
                
                <button
                  onClick={() => handleToggle(alert.id, alert.is_active)}
                  className={`p-2 rounded-lg ${
                    alert.is_active 
                      ? "bg-primary/20 text-primary" 
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                  title={alert.is_active ? "Desativar" : "Ativar"}
                >
                  <span className="material-symbols-outlined text-base">
                    {alert.is_active ? "notifications_active" : "notifications_off"}
                  </span>
                </button>
                
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="p-2 text-error hover:bg-error/20 rounded-lg"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}