"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import Link from "next/link";
import { MobileHeader, MobileNav } from "@/components/Sidebar";

const PDFDownloadLink = lazy(() => import("@react-pdf/renderer").then(mod => ({ default: mod.PDFDownloadLink })));
const PDFReport = lazy(() => import("@/components/ReportPDF").then(mod => ({ default: mod.PDFReport })));

interface ReportData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  budget: { category: string; limit: number; spent: number }[];
  transactions: { id: string; description: string; amount: number; type: string; category: string; date: string }[];
}

export default function ReportsPage() {
  const { signOut } = useAuth();
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
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="text-lg font-bold text-on-surface min-w-[160px] text-center">
          {monthName} {year}
        </span>
        <button
          onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
          disabled={!canGoNext}
          className={`p-2 rounded-full ${canGoNext ? "hover:bg-surface-container-high text-on-surface-variant" : "opacity-50"}`}
        >
          <span className="material-symbols-outlined">chevron_right</span>
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
              <Suspense fallback={<button disabled className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary/50 text-on-primary rounded-full font-medium">A carregar...</button>}>
                <PDFDownloadLink
                  document={<PDFReport data={reportData} />}
                  fileName={`famflow-relatorio-${selectedMonth}.pdf`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-medium hover:brightness-110"
                >
                  {({ loading }) => (
                    <>
                      <span className="material-symbols-outlined">download</span>
                      {loading ? "A gerar PDF..." : "Baixar PDF"}
                    </>
                  )}
                </PDFDownloadLink>
              </Suspense>
              
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-medium"
              >
                <span className="material-symbols-outlined">share</span>
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
              <span className="material-symbols-outlined">table_chart</span>
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

  return <div className="p-8 space-y-8">{pageContent}</div>;
}