"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function TransactionsPage() {
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "expense" as "income" | "expense", category: "" });
  const isMobile = useDeviceType();

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

      {isMobile ? (
        <div className="space-y-3">
          {transactions.map((trans) => (
            <div key={trans.id} className="bg-surface-container rounded-lg p-4">
              {editingId === trans.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface flex-1"
                      placeholder="Categoria"
                    />
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-24"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleCancel} className="text-on-surface-variant text-sm">Cancelar</button>
                    <button onClick={() => handleSave(trans.id)} className="text-primary text-sm font-medium">Guardar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {trans.type === "income" ? "payments" : "shopping_bag"}
                    </span>
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
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => handleDelete(trans.id)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors" aria-label="Apagar">
                        <span className="material-symbols-outlined text-base">delete</span>
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
          <table className="w-full" role="table" aria-label="Transações">
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
                          aria-label="Descrição"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="bg-surface-container-low border-none rounded px-3 py-2 text-on-surface w-full"
                          aria-label="Categoria"
                        />
                      </td>
                      <td className="p-4 text-on-surface-variant">{trans.date}</td>
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
                          <span className="material-symbols-outlined text-on-surface-variant">
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
                        <button onClick={() => handleEdit(trans)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary transition-colors text-xs font-medium" aria-label={`Editar ${trans.description}`}>
                          <span className="material-symbols-outlined text-base">edit</span>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(trans.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error transition-colors text-xs font-medium ml-2" aria-label={`Apagar ${trans.description}`}>
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
      )}
    </div>
  );
}