"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AIInsightItem } from "@/lib/ai/types";

export interface AIInsightsState {
  insights: AIInsightItem[];
  loading: boolean;
  error: string | null;
  generatedAt: string | null;
  cached: boolean;
  refetch: (month?: string, forceRefresh?: boolean) => Promise<void>;
}

export interface SavingsTip {
  type: "tip";
  title: string;
  description: string;
  impactAmount?: number;
  impactPercentage?: number;
  currentSavingsRate?: number;
  targetSavingsRate?: number;
}

export interface AIAlert {
  type: "alert";
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentage?: number;
  previousAmount?: number;
  threshold?: number;
  severity?: "high" | "medium" | "low";
}

export function useAIInsights(month: string): AIInsightsState & {
  savingsTips: SavingsTip[];
  alerts: AIAlert[];
  currentSavingsRate?: number;
} {
  const { supabase } = useAuth();
  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const fetchInsights = useCallback(async (m: string, forceRefresh = false) => {
    if (!m) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/ai/insights?month=${m}${forceRefresh ? "&refresh=1" : ""}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Erro ao carregar insights");
      const data = await res.json();
      setInsights(data.insights || []);
      setGeneratedAt(data.generated_at || null);
      setCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights(month);
  }, [month, fetchInsights]);

  // Extract savings tips from insights
  const savingsTips = useMemo<SavingsTip[]>(() => {
    return insights.filter((i): i is SavingsTip => 
      i.type === "tip" && (
        i.title.toLowerCase().includes("poupança") ||
        i.title.toLowerCase().includes("poupar") ||
        i.description.toLowerCase().includes("poupança") ||
        i.description.toLowerCase().includes("poupar") ||
        i.description.toLowerCase().includes("reduzir") ||
        i.description.toLowerCase().includes("economizar")
      )
    );
  }, [insights]);

  // Extract alerts from insights
  const alerts = useMemo<AIAlert[]>(() => {
    return insights.filter((i): i is AIAlert => 
      i.type === "alert" ||
      i.type === "warning" && (
        i.title.toLowerCase().includes("+") ||
        i.description.toLowerCase().includes("aumentou") ||
        i.description.toLowerCase().includes("cresceu") ||
        i.description.toLowerCase().includes("mais que") ||
        i.percentage !== undefined && i.percentage > 30
      )
    );
  }, [insights]);

  // Calculate current savings rate from insights
  const currentSavingsRate = useMemo<number | undefined>(() => {
    const savingsInsight = insights.find(i => 
      i.description.toLowerCase().includes("poupança") && 
      i.percentage !== undefined
    );
    return savingsInsight?.percentage;
  }, [insights]);

  return {
    insights,
    loading,
    error,
    generatedAt,
    cached,
    refetch: (month?: string, forceRefresh?: boolean) => fetchInsights(month || "", forceRefresh),
    savingsTips,
    alerts,
    currentSavingsRate,
  };
}