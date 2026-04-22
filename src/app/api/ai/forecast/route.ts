import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminSupabase } from "@/lib/supabase/server";
import { groqChatJSON } from "@/lib/ai/groq";
import { buildForecastPrompt } from "@/lib/ai/prompts";
import { AIForecastPayload, AIForecastItem } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 7;

function detectRecurring(transactions: { description: string; amount: number; date: string; type: string }[]): { description: string; amount: number; frequency: string }[] {
  const byDesc: Record<string, { amount: number; dates: string[] }> = {};
  
  transactions.filter(t => t.type === "expense").forEach(t => {
    const key = t.description.toLowerCase().trim();
    if (!byDesc[key]) byDesc[key] = { amount: t.amount, dates: [] };
    byDesc[key].dates.push(t.date);
  });

  const recurring: { description: string; amount: number; frequency: string }[] = [];
  
  for (const [desc, data] of Object.entries(byDesc)) {
    if (data.dates.length < 2) continue;
    const dates = data.dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    
    const diffs: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      diffs.push(Math.round((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    let frequency = "irregular";
    
    if (avgDiff >= 25 && avgDiff <= 35) frequency = "mensal";
    else if (avgDiff >= 7 && avgDiff <= 10) frequency = "quinzenal";
    else if (avgDiff >= 3 && avgDiff <= 5) frequency = "semanal";
    
    if (frequency !== "irregular" && dates.length >= 2) {
      recurring.push({ description: desc, amount: data.amount, frequency });
    }
  }
  
  return recurring.slice(0, 10);
}

async function generateForecast(data: AIForecastPayload) {
  const prompt = buildForecastPrompt(data);
  return await groqChatJSON<{ forecasts: AIForecastItem[]; summary: { totalPredicted: number; confidenceLow: number; confidenceHigh: number; narrative: string } }>({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    maxTokens: 1536,
  });
}

function computeBaselineForecast(history: { amount: number; month: string }[], _category: string): { predictedAmount: number; confidenceLow: number; confidenceHigh: number; trend: "up" | "down" | "stable"; changePercent: number } {
  if (history.length === 0) {
    return { predictedAmount: 0, confidenceLow: 0, confidenceHigh: 0, trend: "stable", changePercent: 0 };
  }

  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const last3 = sorted.slice(-3);
  const avg = last3.reduce((s, h) => s + h.amount, 0) / last3.length;
  
  let trend: "up" | "down" | "stable" = "stable";
  let changePercent = 0;
  
  if (sorted.length >= 2) {
    const first = sorted[0].amount;
    const last = sorted[sorted.length - 1].amount;
    if (first > 0) {
      changePercent = ((last - first) / first) * 100;
      if (changePercent > 5) trend = "up";
      else if (changePercent < -5) trend = "down";
    }
  }
  
  const trendFactor = trend === "up" ? 1.08 : trend === "down" ? 0.92 : 1.0;
  const predictedAmount = Math.round(avg * trendFactor * 100) / 100;
  const confidenceLow = Math.round(predictedAmount * 0.85 * 100) / 100;
  const confidenceHigh = Math.round(predictedAmount * 1.15 * 100) / 100;
  
  return { predictedAmount, confidenceLow, confidenceHigh, trend, changePercent: Math.round(changePercent) };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: "month é obrigatório (YYYY-MM)" }, { status: 400 });
    }

    const admin = await createAdminSupabase();

    const cached = await admin
      .from("expense_predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("target_month", monthParam)
      .single();

    if (cached.data && cached.data.generated_at) {
      const cacheAge = Date.now() - new Date(cached.data.generated_at).getTime();
      if (cacheAge < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
        const forecasts = await admin
          .from("expense_predictions")
          .select("*")
          .eq("user_id", user.id)
          .eq("target_month", monthParam);
        return NextResponse.json({ forecasts: forecasts.data || [], cached: true });
      }
    }

    const [profileResult, transResult] = await Promise.all([
      supabase.from("profiles").select("family_id, billing_cycle_day").eq("id", user.id).single(),
      supabase.from("transactions_decrypted").select("description, amount, type, category, date").eq("user_id", user.id).order("date", { ascending: false }),
    ]);

    if (!profileResult.data) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const billingDay = profileResult.data.billing_cycle_day || 1;
    const transactions = transResult.data || [];

    const [targetYear, targetMonth] = monthParam.split("-").map(Number);
    const sixMonthsAgo = new Date(targetYear, targetMonth - 1, 1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const recentTrans = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);

    const historyByCategory: Record<string, { amount: number; month: string }[]> = {};
    recentTrans.filter(t => t.type === "expense").forEach(t => {
      const d = new Date(t.date);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!historyByCategory[t.category]) historyByCategory[t.category] = [];
      historyByCategory[t.category].push({ amount: Number(t.amount), month: m });
    });

    for (const cat of Object.keys(historyByCategory)) {
      const byMonth: Record<string, number> = {};
      historyByCategory[cat].forEach(h => {
        byMonth[h.month] = (byMonth[h.month] || 0) + h.amount;
      });
      historyByCategory[cat] = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
    }

    const recurring = detectRecurring(transactions);

    const payload: AIForecastPayload = {
      familyId: profileResult.data.family_id,
      targetMonth: monthParam,
      historyByCategory,
      recurringPatterns: recurring,
      billingCycleDay: billingDay,
    };

    let forecastResult: { forecasts: AIForecastItem[]; summary: { totalPredicted: number; confidenceLow: number; confidenceHigh: number; narrative: string } };
    try {
      forecastResult = await generateForecast(payload);
    } catch (aiError) {
      console.warn("AI forecast generation failed, using baseline:", aiError);
      const baselines = Object.entries(historyByCategory).map(([category, history]) => {
        const baseline = computeBaselineForecast(history, category);
        return {
          category,
          predictedAmount: baseline.predictedAmount,
          confidenceLow: baseline.confidenceLow,
          confidenceHigh: baseline.confidenceHigh,
          reasoning: "Previsão baseada na média dos últimos meses.",
          trend: baseline.trend,
          changePercent: baseline.changePercent,
        };
      });
      const total = baselines.reduce((s, f) => s + f.predictedAmount, 0);
      forecastResult = {
        forecasts: baselines,
        summary: {
          totalPredicted: total,
          confidenceLow: total * 0.85,
          confidenceHigh: total * 1.15,
          narrative: "Previsão calculada com base no histórico dos últimos 6 meses.",
        },
      };
    }

    await admin.from("expense_predictions").delete()
      .eq("user_id", user.id)
      .eq("target_month", monthParam);

    for (const f of forecastResult.forecasts) {
      await admin.from("expense_predictions").insert({
        user_id: user.id,
        target_month: monthParam,
        category: f.category,
        predicted_amount: f.predictedAmount,
        confidence_low: f.confidenceLow,
        confidence_high: f.confidenceHigh,
        reasoning: f.reasoning,
        trend: f.trend,
        change_percent: f.changePercent,
      });
    }

    return NextResponse.json({ forecasts: forecastResult.forecasts, summary: forecastResult.summary, cached: false });
  } catch (error) {
    console.error("Forecast API error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}