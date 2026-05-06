"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useGoalContributions, useUpdateGoalContribution, useDeleteGoalContribution } from "@/hooks/useGoalContributions";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";
import { TransactionItem, allCategories } from "@/components/TransactionItem";
import { GoalContributionList } from "@/components/GoalContributionList";
import { useToast } from "@/components/Toast";
import { CSVImport } from "@/components/CSVImport";
import { Upload } from "lucide-react";

type Tab = "transactions" | "contributions";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const { data: contributions } = useGoalContributions(user?.id);
  const updateContribution = useUpdateGoalContribution();
  const deleteContribution = useDeleteGoalContribution();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", date: "" });
  const [contributionEditForm, setContributionEditForm] = useState({ amount: "", date: "" });
  const [showCSVImport, setShowCSVImport] = useState(false);
  const isMobile = useDeviceType();

  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    if (dateRange?.start) {
      result = result.filter(t => t.date >= dateRange.start);
    }
    if (dateRange?.end) {
      result = result.filter(t => t.date <= dateRange.end);
    }
    
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aVal: string | number | Date;
        let bVal: string | number | Date;
        
        switch (sortConfig.key) {
          case 'date':
            aVal = new Date(a.date);
            bVal = new Date(b.date);
            break;
          case 'amount':
            aVal = a.amount;
            bVal = b.amount;
            break;
          case 'description':
            aVal = a.description.toLowerCase();
            bVal = b.description.toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [transactions, dateRange, sortConfig]);

  const handleClearFilter = () => {
    setDateRange(null);
  };

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key !== key) {
        return { key, direction: 'desc' };
      }
      if (current.direction === 'desc') {
        return { key, direction: 'asc' };
      }
      return null;
    });
  };

  const handleEdit = (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;
    
    setEditForm({
      description: trans.description,
      amount: trans.amount.toString(),
      type: trans.type,
      category: trans.category,
      date: trans.date,
    });
    setEditingId(id);
  };

  const handleSave = (id: string) => {
    updateTransaction(id, {
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      type: editForm.type,
      category: editForm.category,
      date: editForm.date,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja excluir esta transação?")) {
      deleteTransaction(id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleContributionEdit = (id: string) => {
    const contrib = contributions?.find(c => c.id === id);
    if (!contrib) return;
    setEditingId(id);
    setContributionEditForm({
      amount: contrib.amount.toString(),
      date: contrib.contribution_date,
    });
  };

  const handleContributionSave = async (id: string) => {
    if (!user) return;
    try {
      await updateContribution.mutateAsync({
        id,
        amount: parseFloat(contributionEditForm.amount),
        contributionDate: contributionEditForm.date,
        userId: user.id,
      });
      showToast("Contribuição atualizada!", "success");
      setEditingId(null);
    } catch (error) {
      console.error("Error updating contribution:", error);
      showToast("Erro ao atualizar contribuição.", "error");
    }
  };

  const handleContributionDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Tem a certeza que deseja excluir esta contribuição?")) return;
    try {
      await deleteContribution.mutateAsync({ id, userId: user.id });
      showToast("Contribuição eliminada!", "success");
    } catch (error) {
      console.error("Error deleting contribution:", error);
      showToast("Erro ao eliminar contribuição.", "error");
    }
  };

  const handleContributionCancel = () => {
    setEditingId(null);
  };

  const handleContributionFormChange = (field: string, value: string) => {
    setContributionEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8 pb-32 md:pb-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Histórico</h1>
        <p className="text-on-surface-variant">Transações e contribuições das metas</p>
      </header>

      <div className="flex gap-2 bg-surface-container rounded-full p-1 mb-6 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "transactions"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Icon name="receipt_long" size={18} />
          Transações
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contributions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "contributions"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Icon name="savings" size={18} />
          Contribuições
        </button>
      </div>

      {activeTab === "transactions" && (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-surface-container rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-on-surface-variant">De:</label>
              <input
                type="date"
                value={dateRange?.start || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value, end: prev?.end || '' }))}
                className="bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm text-on-surface"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-on-surface-variant">Até:</label>
              <input
                type="date"
                value={dateRange?.end || ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: prev?.start || '', end: e.target.value }))}
                className="bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm text-on-surface"
              />
            </div>
            {dateRange && (dateRange.start || dateRange.end) && (
              <button 
                onClick={handleClearFilter} 
                className="text-sm text-primary hover:underline"
              >
                Limpar filtro
              </button>
            )}
            <button
              onClick={() => setShowCSVImport(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
            <span className="text-sm text-on-surface-variant">
              {filteredTransactions.length} de {transactions.length} transações
            </span>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {filteredTransactions.map((trans) => (
                <div key={trans.id} className="bg-surface-container rounded-lg p-4">
                  <TransactionItem
                    transaction={trans}
                    isEditing={editingId === trans.id}
                    editForm={editForm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onFormChange={(field, value) => setEditForm({ ...editForm, [field]: value })}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container rounded-lg overflow-hidden">
              <table className="w-full" aria-label="Transações">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th 
                      scope="col" 
                      className="text-left p-4 text-sm font-medium text-on-surface-variant cursor-pointer hover:text-primary"
                      onClick={() => handleSort('description')}
                    >
                      Descrição {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th scope="col" className="text-left p-4 text-sm font-medium text-on-surface-variant">Categoria</th>
                    <th 
                      scope="col" 
                      className="text-left p-4 text-sm font-medium text-on-surface-variant cursor-pointer hover:text-primary"
                      onClick={() => handleSort('date')}
                    >
                      Data {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th 
                      scope="col" 
                      className="text-right p-4 text-sm font-medium text-on-surface-variant cursor-pointer hover:text-primary"
                      onClick={() => handleSort('amount')}
                    >
                      Valor {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th scope="col" className="text-right p-4 text-sm font-medium text-on-surface-variant">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trans) => (
                    <tr key={trans.id} className="border-t border-surface-container-high hover:bg-surface-container-low transition-colors">
                      {editingId === trans.id ? (
                        <>
                          <td className="p-4">
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                              aria-label="Descrição"
                            />
                          </td>
                          <td className="p-4">
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                              aria-label="Categoria"
                            >
                              <option value="">Selecionar</option>
                              {allCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4">
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                              aria-label="Data"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-24"
                              aria-label="Valor"
                            />
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleSave(trans.id)} className="text-primary hover:underline mr-3">Guardar</button>
                            <button onClick={handleCancel} className="text-on-surface-variant hover:underline">Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon name={trans.type === "income" ? "payments" : "shopping_bag"} size={20} className="text-on-surface-variant" />
                              <span className="font-medium">{trans.description}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs">{trans.category}</span>
                          </td>
                          <td className="p-4 text-on-surface-variant">{new Date(trans.date).toLocaleDateString("pt-PT")}</td>
                          <td className={`p-4 text-right font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                            {trans.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(trans.amount)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => handleEdit(trans.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium" aria-label={`Editar ${trans.description}`}>
                              <Icon name="edit" size={16} className="text-base" />
                              Editar
                            </button>
                            <button onClick={() => handleDelete(trans.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium ml-2" aria-label={`Apagar ${trans.description}`}>
                              <Icon name="delete" size={16} className="text-base" />
                              Apagar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "contributions" && (
        <div className="bg-surface-container rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-on-surface">Contribuições às Metas</h2>
            <a 
              href="/dashboard/goal-contribution/new"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium"
            >
              <Icon name="add" size={16} />
              Adicionar
            </a>
          </div>
          <GoalContributionList 
            contributions={contributions || []} 
            editingId={editingId}
            editForm={contributionEditForm}
            onEdit={handleContributionEdit}
            onDelete={handleContributionDelete}
            onFormChange={handleContributionFormChange}
            onSave={handleContributionSave}
            onCancel={handleContributionCancel}
          />
        </div>
      )}

      {showCSVImport && (
        <CSVImport onClose={() => setShowCSVImport(false)} />
      )}
    </div>
  );
}