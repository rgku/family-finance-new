"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";

export default function TransactionsPage() {
  const { user, supabase, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(true);

  // Demo transactions
  const demoTransactions = [
    { id: "1", description: "Salário", amount: 8400, type: "income", category: "Renda", date: "2024-04-01" },
    { id: "2", description: "Supermercado", amount: 150, type: "expense", category: "Alimentação", date: "2024-04-03" },
    { id: "3", description: "Restaurante", amount: 85, type: "expense", category: "Lazer", date: "2024-04-05" },
    { id: "4", description: "Farmácia", amount: 45, type: "expense", category: "Saúde", date: "2024-04-07" },
    { id: "5", description: "Uber", amount: 32, type: "expense", category: "Transporte", date: "2024-04-08" },
    { id: "6", description: "Netflix", amount: 15.99, type: "expense", category: "Lazer", date: "2024-04-10" },
    { id: "7", description: "Luz", amount: 120, type: "expense", category: "Moradia", date: "2024-04-12" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">A carregar...</p>
      </div>
    );
  }

  const transactions = demoTransactions;

  return (
    <div className="min-h-screen bg-surface">
      {isMobile ? (
        <>
          <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg text-on-surface">Transações</h1>
            <div className="w-10"></div>
          </header>

          <main className="pt-20 px-6 max-w-2xl mx-auto pb-32">
            <div className="space-y-2">
              {transactions.map((trans) => (
                <div key={trans.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined">
                        {trans.type === "income" ? "payments" : "shopping_bag"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{trans.description}</p>
                      <p className="text-xs text-on-surface-variant">{trans.category} • {new Date(trans.date).toLocaleDateString("pt-PT")}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                    {trans.type === "income" ? "+" : "-"}{formatCurrencyWithSymbol(trans.amount)}
                  </p>
                </div>
              ))}
            </div>
          </main>

          <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
            <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 p-3">
              <span className="material-symbols-outlined">home</span>
              <span className="font-inter font-medium text-[10px] mt-1">Home</span>
            </Link>
            <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center text-slate-500 p-3">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="font-inter font-medium text-[10px] mt-1">Add</span>
            </Link>
            <Link href="/dashboard/goals" className="flex flex-col items-center justify-center text-slate-500 p-3">
              <span className="material-symbols-outlined">track_changes</span>
              <span className="font-inter font-medium text-[10px] mt-1">Metas</span>
            </Link>
          </nav>
        </>
      ) : (
        <main className="ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-on-surface">Transações</h1>
            <Link href="/dashboard/transaction/new" className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold">
              + Nova Transação
            </Link>
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
                {transactions.map((trans) => (
                  <tr key={trans.id} className="border-t border-surface-container-high hover:bg-surface-container-low">
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
        </main>
      )}
    </div>
  );
}