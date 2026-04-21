"use client";

import { useState, useMemo } from "react";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { Icon } from "@/components/Icon";

const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  .map(c => c.value)
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => {
    if (a === "Outros") return 1;
    if (b === "Outros") return -1;
    return a.localeCompare(b);
  });

export default function TransactionsPage() {
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "", date: "" });
  const isMobile = useDeviceType();

  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    
    if (dateRange?.start) {
      result = result.filter(t => t.date >= dateRange.start);
    }
    if (dateRange?.end) {
      result = result.filter(t => t.date <= dateRange.end);
    }
    
    return result;
  }, [transactions, dateRange]);

  const handleClearFilter = () => {
    setDateRange(null);
  };

  const handleEdit = (trans: any) => {
    setEditForm({
      description: trans.description,
      amount: trans.amount.toString(),
      type: trans.type,
      category: trans.category,
      date: trans.date,
    });
    setEditingId(trans.id);
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

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Transações</h1>
          <p className="text-on-surface-variant">Histórico completo de transações</p>
        </div>
      </header>

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
        <span className="ml-auto text-sm text-on-surface-variant">
          {filteredTransactions.length} de {transactions.length} transações
        </span>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {filteredTransactions.map((trans) => (
            <div key={trans.id} className="bg-surface-container rounded-lg p-4">
              {editingId === trans.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full text-sm"
                    placeholder="Descrição"
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
                    />
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
                    >
                      <option value="">Selecionar categoria</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface text-sm w-full"
                      placeholder="Valor"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={handleCancel} className="text-on-surface-variant text-sm px-3 py-1.5">Cancelar</button>
                    <button onClick={() => handleSave(trans.id)} className="text-primary text-sm font-medium px-3 py-1.5">Guardar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name={trans.type === "income" ? "payments" : "shopping_bag"} size={20} className="text-on-surface-variant" />
                    <div>
                      <p className="font-medium text-on-surface">{trans.description}</p>
                      <p className="text-xs text-on-surface-variant">{trans.category} • {new Date(trans.date).toLocaleDateString("pt-PT")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                      {trans.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(trans.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(trans)} className="p-2 rounded-lg text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors" aria-label="Editar">
                        <Icon name="edit" size={16} className="text-base" />
                      </button>
                      <button onClick={() => handleDelete(trans.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors" aria-label="Apagar">
                        <Icon name="delete" size={16} className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container rounded-lg overflow-hidden">
          <table className="w-full" aria-label="Transações">
            <thead className="bg-surface-container-low">
              <tr>
                <th scope="col" className="text-left p-4 text-sm font-medium text-on-surface-variant">Descrição</th>
                <th scope="col" className="text-left p-4 text-sm font-medium text-on-surface-variant">Categoria</th>
                <th scope="col" className="text-left p-4 text-sm font-medium text-on-surface-variant">Data</th>
                <th scope="col" className="text-right p-4 text-sm font-medium text-on-surface-variant">Valor</th>
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
                        <button onClick={() => handleEdit(trans)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium" aria-label={`Editar ${trans.description}`}>
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
    </div>
  );
}