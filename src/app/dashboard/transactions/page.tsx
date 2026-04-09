"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function TransactionsPage() {
  const { loading } = useAuth();

  const demoTransactions = [
    { id: "1", description: "Salário", amount: 5200, type: "income", category: "Renda", date: "2024-04-01" },
    { id: "2", description: "Supermercado", amount: 150, type: "expense", category: "Alimentação", date: "2024-04-03" },
    { id: "3", description: "Restaurante", amount: 85, type: "expense", category: "Lazer", date: "2024-04-05" },
    { id: "4", description: "Farmácia", amount: 45, type: "expense", category: "Saúde", date: "2024-04-07" },
    { id: "5", description: "Uber", amount: 32, type: "expense", category: "Transporte", date: "2024-04-08" },
    { id: "6", description: "Netflix", amount: 15.99, type: "expense", category: "Lazer", date: "2024-04-10" },
    { id: "7", description: "Luz", amount: 120, type: "expense", category: "Moradia", date: "2024-04-12" },
    { id: "8", description: "Freelance", amount: 800, type: "income", category: "Renda", date: "2024-04-15" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">A carregar...</p>
      </div>
    );
  }

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
            </tr>
          </thead>
          <tbody>
            {demoTransactions.map((trans) => (
              <tr key={trans.id} className="border-t border-surface-container-high hover:bg-surface-container-low transition-colors">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}