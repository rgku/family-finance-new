"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function TransactionsPage() {
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "" });

  const handleEdit = (trans: any) => {
    setEditForm({
      description: trans.description,
      amount: trans.amount.toString(),
      type: trans.type,
      category: trans.category,
    });
    setEditingId(trans.id);
  };

  const handleSave = (id: string) => {
    updateTransaction(id, {
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      type: editForm.type,
      category: editForm.category,
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

      <div className="bg-surface-container rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-on-surface-variant">Descrição</th>
              <th className="text-left p-4 text-sm font-medium text-on-surface-variant">Categoria</th>
              <th className="text-left p-4 text-sm font-medium text-on-surface-variant">Data</th>
              <th className="text-right p-4 text-sm font-medium text-on-surface-variant">Valor</th>
              <th className="text-right p-4 text-sm font-medium text-on-surface-variant">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trans) => (
              <tr key={trans.id} className="border-t border-surface-container-high hover:bg-surface-container-low transition-colors">
                {editingId === trans.id ? (
                  <>
                    <td className="p-4">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                      />
                    </td>
                    <td className="p-4 text-on-surface-variant">{trans.date}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-24"
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
                        <span className="material-symbols-outlined text-slate-400">
                          {trans.type === "income" ? "payments" : "shopping_bag"}
                        </span>
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
                      <button onClick={() => handleEdit(trans)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium">
                        <span className="material-symbols-outlined text-base">edit</span>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(trans.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium ml-2">
                        <span className="material-symbols-outlined text-base">delete</span>
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
    </div>
  );
}