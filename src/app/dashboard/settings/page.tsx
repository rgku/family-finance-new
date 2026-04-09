"use client";

import { useState } from "react";
import { useData } from "@/hooks/DataProvider";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function ExportPage() {
  const { transactions, goals, budgets, loading } = useData();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'all' | 'transactions' | 'goals' | 'budgets') => {
    setExporting(true);
    
    try {
      let csvContent = "";
      let filename = "";

      if (type === 'all' || type === 'transactions') {
        const transHeaders = "ID,Data,Descrição,Categoria,Tipo,Valor\n";
        const transData = transactions.map(t => 
          `${t.id},${t.date},"${t.description}","${t.category}",${t.type},${t.amount}`
        ).join("\n");
        csvContent += "=== TRANSAÇÕES ===\n" + transHeaders + transData + "\n\n";
      }

      if (type === 'all' || type === 'goals') {
        const goalsHeaders = "ID,Nome,Meta,Atual,Prazo,Ícone\n";
        const goalsData = goals.map(g => 
          `${g.id},"${g.name}",${g.target_amount},${g.current_amount},${g.deadline || ''},${g.icon}`
        ).join("\n");
        csvContent += "=== METAS ===\n" + goalsHeaders + goalsData + "\n\n";
      }

      if (type === 'all' || type === 'budgets') {
        const budgetsHeaders = "ID,Categoria,Limite,Gasto\n";
        const budgetsData = budgets.map(b => 
          `${b.id},"${b.category}",${b.limit},${b.spent}`
        ).join("\n");
        csvContent += "=== ORÇAMENTOS ===\n" + budgetsHeaders + budgetsData;
      }

      filename = `fiscal-sanctuary-${type}-${new Date().toISOString().split('T')[0]}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    
    try {
      const data = {
        exportDate: new Date().toISOString(),
        transactions: transactions.map(t => ({
          date: t.date,
          description: t.description,
          category: t.category,
          type: t.type,
          amount: t.amount,
        })),
        goals: goals.map(g => ({
          name: g.name,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount,
          deadline: g.deadline,
          progress: Math.round((g.current_amount / g.target_amount) * 100),
        })),
        budgets: budgets.map(b => ({
          category: b.category,
          limit: b.limit,
          spent: b.spent,
        })),
        summary: {
          totalTransactions: transactions.length,
          totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
          balance: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                   transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
          totalGoals: goals.length,
          totalBudgets: budgets.length,
        },
      };

      const filename = `fiscal-sanctuary-full-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Dados exportados em JSON!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface">Exportar Dados</h1>
        <p className="text-on-surface-variant">Faça download dos seus dados (GDPR)</p>
      </header>

      {/* Summary Stats */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <h2 className="font-bold text-lg">Resumo dos seus dados</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-on-surface-variant">Transações</p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-on-surface-variant">Metas</p>
            <p className="text-xl font-bold">{goals.length}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-on-surface-variant">Orçamentos</p>
            <p className="text-xl font-bold">{budgets.length}</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-on-surface-variant">Total Gasto</p>
            <p className="text-xl font-bold text-tertiary">
              {formatCurrencyWithSymbol(
                transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <h2 className="font-bold text-lg">Exportar em CSV</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('transactions')}
            disabled={exporting || transactions.length === 0}
            className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <span className="text-sm font-medium">Transações</span>
          </button>
          
          <button
            onClick={() => handleExport('goals')}
            disabled={exporting || goals.length === 0}
            className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-secondary">track_changes</span>
            <span className="text-sm font-medium">Metas</span>
          </button>
          
          <button
            onClick={() => handleExport('budgets')}
            disabled={exporting || budgets.length === 0}
            className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-tertiary">pie_chart</span>
            <span className="text-sm font-medium">Orçamentos</span>
          </button>
          
          <button
            onClick={() => handleExport('all')}
            disabled={exporting || (transactions.length === 0 && goals.length === 0 && budgets.length === 0)}
            className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-on-surface">download</span>
            <span className="text-sm font-medium">Tudo (CSV)</span>
          </button>
        </div>
      </div>

      {/* JSON Export */}
      <div className="bg-surface-container rounded-lg p-6 space-y-4">
        <h2 className="font-bold text-lg">Exportar em JSON</h2>
        <p className="text-sm text-on-surface-variant">
          Exporta todos os dados num ficheiro JSON estruturado, incluindo resumo e estatísticas.
        </p>
        <button
          onClick={handleExportJSON}
          disabled={exporting}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {exporting ? "A exportar..." : "Exportar Dados Completos (JSON)"}
        </button>
      </div>

      {/* GDPR Notice */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">info</span>
          <div className="text-sm text-on-surface-variant">
            <p className="font-medium text-on-surface mb-1">Direito à Portabilidade (GDPR)</p>
            <p>Tens o direito de receber os teus dados pessoais num formato estruturado, de uso comum e leitura automática. Este ficheiro inclui todas as transações, metas e orçamentos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}