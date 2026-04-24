"use client";

import { useState, useEffect, useCallback } from "react";
import { AIForecastItem } from "@/lib/ai/types";

export interface AIForecastSummary {
  totalPredicted: number;
  confidenceLow: number;
  confidenceHigh: number;
  narrative: string;
}

export interface AIForecastState {
  forecasts: AIForecastItem[];
  summary: AIForecastSummary | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  refetch: (month?: string) => Promise<void>;
}

export function useAIForecast(month: string): AIForecastState {
  const [forecasts, setForecasts] = useState<AIForecastItem[]>([]);
  const [summary, setSummary] = useState<AIForecastSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const fetchForecast = useCallback(async (m: string) => {
    if (!m) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/forecast?month=${m}`, { credentials: 'include' });
      if (!res.ok) throw new Error("Erro ao carregar previsão");
      const data = await res.json();
      setForecasts(data.forecasts || []);
      setSummary(data.summary || null);
      setCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setForecasts([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(month);
  }, [month, fetchForecast]);

  return {
    forecasts,
    summary,
    loading,
    error,
    cached,
    refetch: (month?: string) => fetchForecast(month || ""),
  };
}