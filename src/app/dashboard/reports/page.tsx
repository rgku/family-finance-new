"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";

interface PDFDocumentWithLinkProps {
  data: ReportData;
  selectedMonth: string;
}

function PDFDocumentWithLink({ data, selectedMonth }: PDFDocumentWithLinkProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) {
    return (
      <button disabled className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high/50 text-on-surface/50 rounded-full font-medium">
        <Icon name="download" size={20} />
        Sem dados disponíveis
      </button>
    );
  }

  const handleClick = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import for lazy loading
      const { pdf } = await import("@react-pdf/renderer");
      const { PDFReport } = await import("@/components/ReportPDF");
      const blob = await pdf(<PDFReport data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `famflow-relatorio-${selectedMonth}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tenta novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-medium hover:brightness-110 disabled:opacity-50"
    >
      <Icon name="download" size={20} />
      {isGenerating ? "A gerar PDF..." : "Baixar PDF"}
    </button>
  );
}

interface Goal {
  name: string;
  target: number;
  current: number;
  deadline?: string | null;
}

interface ReportData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  savings?: number;
  budget: { category: string; limit: number; spent: number }[];
  transactions: { id: string; description: string; amount: number; type: string; category: string; date: string }[];
  goals?: Goal[];
  previousMonth?: {
    income: number;
    expenses: number;
    balance: number;
  };
  stats?: {
    dailyAverage: number;
    highestExpense: { description: string; amount: number };
    totalTransactions: number;
    categoriesCount: number;
    daysInPeriod: number;
  };
}

export default function ReportsPage() {
  const { signOut } = useAuth();
  const { transactions, goals } = useData();
  const isMobile = useDeviceType();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthName = monthNames[month - 1];

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/reports/monthly?month=${selectedMonth}`, { cache: "no-store", signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setReportData(data);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to generate report:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedMonth]);

  // Calculate additional data for PDF
  const enrichedReportData = useMemo<ReportData | null>(() => {
    if (!reportData) return null;

    const prevMonthDate = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    
    // Filter transactions for current and previous month
    const currentMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month - 1;
    });

    const prevMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === prevMonthDate.year && d.getMonth() === prevMonthDate.month - 1;
    });

    // Calculate previous month data
    const prevIncome = prevMonthTrans.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevMonthTrans.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    
    // Calculate stats
    const daysInPeriod = new Date(year, month, 0).getDate();
    const totalExpenses = currentMonthTrans.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const categories = [...new Set(currentMonthTrans.map(t => t.category))];
    
    const highestExpense = currentMonthTrans
      .filter(t => t.type === "expense")
      .sort((a, b) => b.amount - a.amount)[0];

    return {
      ...reportData,
      goals: goals.map(g => ({
        name: g.name,
        target: g.target_amount,
        current: g.current_amount,
        deadline: g.deadline,
      })),
      previousMonth: {
        income: prevIncome,
        expenses: prevExpenses,
        balance: prevIncome - prevExpenses,
      },
      stats: {
        dailyAverage: totalExpenses / daysInPeriod,
        highestExpense: highestExpense
          ? { description: highestExpense.description, amount: highestExpense.amount }
          : { description: "N/A", amount: 0 },
        totalTransactions: currentMonthTrans.length,
        categoriesCount: categories.length,
        daysInPeriod,
      },
    };
  }, [reportData, transactions, goals, year, month]);

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const handleCSVExport = () => {
    if (!reportData) return;
    
    const escapeCSV = (str: string) => {
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csvRows = [
      ["Data", "Descrição", "Categoria", "Tipo", "Valor"],
      ...reportData.transactions.map(t => [
        t.date,
        escapeCSV(t.description),
        escapeCSV(t.category),
        t.type,
        t.type === "income" ? t.amount : -t.amount,
      ]),
    ];
    
    const csv = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `famflow-dados-${selectedMonth}.csv`;
    a.click();
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/dashboard/reports/shared?month=${selectedMonth}&token=${btoa(selectedMonth)}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copiado para a área de transferência!");
  };

  const pageContent = (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          ← Voltar ao Dashboard
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Relatórios</h1>
        <p className="text-on-surface-variant">Gera e baixa relatórios financeiros</p>
      </header>

      <div className="flex items-center justify-center gap-4 mb-8 bg-surface-container rounded-lg py-4">
        <button
          onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="text-lg font-bold text-on-surface min-w-[160px] text-center">
          {monthName} {year}
        </span>
        <button
          onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
          disabled={!canGoNext}
          className={`p-2 rounded-full ${canGoNext ? "hover:bg-surface-container-high text-on-surface-variant" : "opacity-50"}`}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-container rounded-lg p-6">
              <p className="text-sm text-on-surface-variant mb-1">Receitas</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrencyWithSymbol(reportData.income)}
              </p>
            </div>
            <div className="bg-surface-container rounded-lg p-6">
              <p className="text-sm text-on-surface-variant mb-1">Despesas</p>
              <p className="text-2xl font-bold text-tertiary">
                {formatCurrencyWithSymbol(reportData.expenses)}
              </p>
            </div>
            <div className="bg-surface-container rounded-lg p-6">
              <p className="text-sm text-on-surface-variant mb-1">Balanço</p>
              <p className={`text-2xl font-bold ${reportData.balance >= 0 ? "text-primary" : "text-error"}`}>
                {formatCurrencyWithSymbol(reportData.balance)}
              </p>
            </div>
          </div>

          {reportData.budget && reportData.budget.length > 0 && (
            <div className="bg-surface-container rounded-lg p-6 mb-8">
              <h2 className="text-lg font-bold text-on-surface mb-4">Orçamentos</h2>
              <div className="space-y-4">
                {reportData.budget.map((b, index) => {
                  const percentUsed = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                  const isOver = percentUsed > 100;
                  const isWarning = percentUsed > 80 && percentUsed <= 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-on-surface">{b.category}</span>
                        <span className={isOver ? "text-error" : isWarning ? "text-yellow-400" : "text-on-surface-variant"}>
                          {formatCurrencyWithSymbol(b.spent)} / {formatCurrencyWithSymbol(b.limit)} ({percentUsed.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOver ? "bg-error" : isWarning ? "bg-yellow-400" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-surface-container rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-on-surface mb-4">Exportar Relatório</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Baixa um relatório PDF completo com todas as transações do mês.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {enrichedReportData ? (
                <PDFDocumentWithLink data={enrichedReportData} selectedMonth={selectedMonth} />
              ) : (
                <button disabled className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high/50 text-on-surface/50 rounded-full font-medium">
                  <Icon name="download" size={20} />
                  Sem dados disponíveis
                </button>
              )}
              
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-medium"
              >
                <Icon name="share" size={20} />
                Compartilhar
              </button>
            </div>
          </div>

          <div className="bg-surface-container rounded-lg p-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Exportar Dados</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Exporta os dados em formato CSV para Excel.
            </p>
            
            <button
              onClick={handleCSVExport}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-medium"
            >
              <Icon name="table_chart" size={20} />
              Exportar CSV
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-on-surface-variant">
          Sem dados para este mês
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
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {pageContent}
      </div>
    </div>
  );
}