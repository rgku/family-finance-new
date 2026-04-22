"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useAIForecast } from "@/hooks/useAIForecast";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { isDateInCustomMonth, formatCustomMonth, getCustomMonthRange } from "@/lib/dateUtils";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { ExpenseChart } from "@/components/charts/ExpenseChart";
import { MobileHeader, MobileNav } from "@/components/Sidebar";
import { Icon } from "@/components/Icon";
import { AIInsightItem } from "@/lib/ai/types";

export default function AnalyticsPage() {
  const { transactions } = useData();
  const { profile, signOut } = useAuth();
  const isMobile = useDeviceType();
  const billingDay = profile?.billing_cycle_day || 1;
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    if (billingDay > 1) {
      const { startDate } = getCustomMonthRange(billingDay, now);
      return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [year, month] = selectedMonth.split("-").map(Number);

  const { insights: aiInsights, loading: aiLoading, refetch } = useAIInsights(selectedMonth);

  const nextMonthParam = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nm = m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
    return `${nm.year}-${String(nm.month).padStart(2, "0")}`;
  })();
  const { forecasts: aiForecasts, loading: forecastLoading, summary: forecastSummary } = useAIForecast(nextMonthParam);
  
  const monthName = profile?.billing_cycle_day && profile.billing_cycle_day > 1
    ? formatCustomMonth(billingDay, new Date(year, month - 1, 25))
    : monthNames[month - 1];

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    if (profile?.billing_cycle_day && profile.billing_cycle_day > 1) {
      return transactions.filter(t => isDateInCustomMonth(t.date, billingDay, year, month));
    }
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getFullYear() === year && transDate.getMonth() === month - 1;
    });
  }, [transactions, year, month, profile?.billing_cycle_day, billingDay]);

  const income = useMemo(() => filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredTransactions.filter(t => t.type === "expense").forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      category: name,
      amount: value,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const monthlyTrend = useMemo(() => {
    const months: { month: string; income: number; expense: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 15);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getFullYear() === d.getFullYear() && transDate.getMonth() === d.getMonth();
      });
      
      months.push({
        month: m,
        income: monthTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    
    return months;
  }, [transactions, year, month]);

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const insightStyles: Record<AIInsightItem["type"], { bg: string; icon: string; color: string }> = {
  success: { bg: "bg-green-500/10", icon: "check_circle", color: "text-green-600" },
  warning: { bg: "bg-amber-500/10", icon: "warning", color: "text-amber-600" },
  info: { bg: "bg-blue-500/10", icon: "info", color: "text-blue-600" },
  tip: { bg: "bg-primary/10", icon: "lightbulb", color: "text-primary" },
};

function InsightCard({ insight }: { insight: AIInsightItem }) {
  const style = insightStyles[insight.type] || insightStyles.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${style.bg}`}>
      <Icon name={style.icon as any} size={20} className={`${style.color} mt-0.5 shrink-0`} />
      <div>
        <p className="font-medium text-on-surface">{insight.title}</p>
        <p className="text-sm text-on-surface-variant mt-0.5">{insight.description}</p>
      </div>
    </div>
  );
}

const pageContent = (
    <>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Análise Financeira</h1>
          <p className="text-on-surface-variant">Veja onde o seu dinheiro está a ir</p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-4 py-2 bg-surface-container rounded-lg">
        <button
          onClick={() => setSelectedMonth(`${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`)}
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="text-xl font-bold text-on-surface min-w-[160px] text-center">
          {profile?.billing_cycle_day && profile.billing_cycle_day > 1
            ? monthName
            : `${monthName} ${year}`}
        </span>
        <button
          onClick={() => setSelectedMonth(`${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`)}
          disabled={!canGoNext}
          className={`p-2 rounded-full text-on-surface-variant ${canGoNext ? "hover:bg-surface-container-high cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary to-primary-container p-6 sm:p-8 rounded-lg text-on-primary min-w-0">
          <p className="text-sm opacity-80">Receitas</p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mt-2 text-wrap">{formatCurrencyWithSymbol(income)}</p>
        </div>
        <div className="bg-surface-container p-6 sm:p-8 rounded-lg min-w-0">
          <p className="text-sm text-on-surface-variant">Despesas</p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-tertiary mt-2 text-wrap">{formatCurrencyWithSymbol(expenses)}</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Tendência Mensal (6 meses)</h3>
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      <div className="bg-surface-container rounded-lg p-6">
        <h3 className="font-bold text-lg mb-6">Despesas por Categoria</h3>
        <ExpenseChart data={categoryBreakdown} />
      </div>

      <div className="bg-surface-container rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon name="sparkles" size={20} className="text-primary" />
            Insights da IA
          </h3>
          {!aiLoading && (
            <button
              onClick={() => refetch(selectedMonth)}
              className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title="Gerar novos insights"
            >
              <Icon name="refresh" size={16} />
            </button>
          )}
        </div>

        {aiLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant text-sm">A analisar os teus dados...</span>
          </div>
        ) : aiInsights.length === 0 && categoryBreakdown.length === 0 ? (
          <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
            <Icon name="lightbulb" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium">Sem dados suficientes</p>
              <p className="text-sm text-on-surface-variant">
                Adicione transações para ver recomendações personalizadas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        )}
      </div>

      {aiForecasts.length > 0 && (
        <div className="bg-surface-container rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Icon name="trending_up" size={20} className="text-secondary" />
              Previsão para Próximo Mês
            </h3>
            {forecastSummary && (
              <span className="text-sm text-on-surface-variant">
                Total: {formatCurrencyWithSymbol(forecastSummary.totalPredicted)}
              </span>
            )}
          </div>

          {forecastLoading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="text-on-surface-variant text-sm">A gerar previsão...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {aiForecasts.slice(0, 6).map((forecast) => {
                const trendIcon = forecast.trend === "up" ? "trending_up" : forecast.trend === "down" ? "trending_down" : "trending_flat";
                const trendColor = forecast.trend === "up" ? "text-error" : forecast.trend === "down" ? "text-green-500" : "text-on-surface-variant";
                return (
                  <div key={forecast.category} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">{forecast.category}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Icon name={trendIcon} size={16} className={trendColor} />
                          <span className={`text-sm font-bold ${trendColor}`}>
                            {forecast.changePercent > 0 ? "+" : ""}{forecast.changePercent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "100%" }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-on-surface-variant">{formatCurrencyWithSymbol(forecast.predictedAmount)}</span>
                        <span className="text-xs text-on-surface-variant">
                          {formatCurrencyWithSymbol(forecast.confidenceLow)} - {formatCurrencyWithSymbol(forecast.confidenceHigh)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {forecastSummary && (
                <p className="text-sm text-on-surface-variant mt-3 italic">{forecastSummary.narrative}</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-24 px-4 pb-24 space-y-6 max-w-2xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return <div className="p-8 space-y-8">{pageContent}</div>;
}