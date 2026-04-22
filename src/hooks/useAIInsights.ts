"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useAIInsights(month: string): AIInsightsState {
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
      const res = await fetch(url);
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

  return {
    insights,
    loading,
    error,
    generatedAt,
    cached,
    refetch: (month?: string, forceRefresh?: boolean) => fetchInsights(month || "", forceRefresh),
  };
}