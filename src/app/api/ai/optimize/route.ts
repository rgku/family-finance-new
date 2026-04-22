import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminSupabase } from "@/lib/supabase/server";
import { groqChatJSON } from "@/lib/ai/groq";
import { buildOptimizePrompt } from "@/lib/ai/prompts";
import { AIBudgetOptimizePayload, AIBudgetSuggestion } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 7;

async function generateOptimize(data: AIBudgetOptimizePayload) {
  const prompt = buildOptimizePrompt(data);
  return await groqChatJSON<{ suggestions: AIBudgetSuggestion[]; summary: string }>({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 1024,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { forceRefresh } = body;

    const admin = await createAdminSupabase();

    if (!forceRefresh) {
      const cached = await admin
        .from("budget_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .order("suggested_at", { ascending: false })
        .limit(1)
        .single();

      if (cached.data && cached.data.suggested_at) {
        const cacheAge = Date.now() - new Date(cached.data.suggested_at).getTime();
        if (cacheAge < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
          return NextResponse.json({ suggestions: cached.data.suggestions, summary: cached.data.summary, cached: true, generated_at: cached.data.suggested_at });
        }
      }
    }

    const [profileResult, budgetsResult, goalsResult, transResult] = await Promise.all([
      supabase.from("profiles").select("family_id").eq("id", user.id).single(),
      supabase.from("budgets").select("category, limit_amount").eq("user_id", user.id),
      supabase.from("goals_decrypted").select("name, target_amount, current_amount, deadline").eq("user_id", user.id),
      supabase.from("transactions_decrypted").select("amount, type, category, date").eq("user_id", user.id).order("date", { ascending: false }).limit(500),
    ]);

    if (!profileResult.data) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = (budgetsResult.data || []).map(b => {
      const spent = (transResult.data || [])
        .filter(t => t.category === b.category && t.type === "expense" && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { category: b.category, limit: Number(b.limit_amount), spent };
    });

    const recentSpending: Record<string, number[]> = {};
    (transResult.data || [])
      .filter(t => t.type === "expense")
      .slice(0, 200)
      .forEach(t => {
        if (!recentSpending[t.category]) recentSpending[t.category] = [];
        recentSpending[t.category].push(Number(t.amount));
      });

    const goals = (goalsResult.data || []).map(g => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      deadline: g.deadline,
    }));

    const incomeResult = await supabase
      .from("transactions_decrypted")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "income")
      .gte("date", `${currentMonth}-01`)
      .lt("date", `${currentMonth}-32`);

    const totalIncome = (incomeResult.data || []).reduce((s, t) => s + Number(t.amount), 0) || 1500;

    const payload: AIBudgetOptimizePayload = {
      familyId: profileResult.data.family_id,
      currentBudgets,
      recentSpending,
      goals,
      totalIncome,
    };

    let result: { suggestions: AIBudgetSuggestion[]; summary: string };
    try {
      result = await generateOptimize(payload);
    } catch (aiError) {
      console.warn("AI optimize generation failed, using fallback:", aiError);
      result = generateFallbackOptimize(currentBudgets, goals);
    }

    await admin.from("budget_suggestions").insert({
      user_id: user.id,
      suggestions: result.suggestions,
      summary: result.summary,
    });

    return NextResponse.json({ suggestions: result.suggestions, summary: result.summary, cached: false, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Optimize API error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function generateFallbackOptimize(budgets: { category: string; limit: number; spent: number }[], goals: { name: string; target: number; current: number }[]): { suggestions: AIBudgetSuggestion[]; summary: string } {
  const suggestions: AIBudgetSuggestion[] = [];

  budgets.forEach(b => {
    if (b.limit > 0) {
      const ratio = b.spent / b.limit;
      if (ratio > 1.1) {
        suggestions.push({
          category: b.category,
          currentLimit: b.limit,
          suggestedLimit: Math.round(b.spent * 1.1),
          reason: `Gastas habitualmente mais do que o budget (${Math.round(ratio * 100)}%).`,
          impactOnGoals: "Ajustar evita estouro de orçamento.",
        });
      } else if (ratio < 0.6 && b.limit > 50) {
        suggestions.push({
          category: b.category,
          currentLimit: b.limit,
          suggestedLimit: Math.round(b.limit * 0.85),
          reason: `Estás a usar menos de ${Math.round(ratio * 100)}% do budget. Podes reduzir.`,
          impactOnGoals: "Reduzir permite realocar para metas de poupança.",
        });
      }
    }
  });

  return {
    suggestions: suggestions.slice(0, 5),
    summary: suggestions.length > 0
      ? `Encontradas ${suggestions.length} oportunidade(s) de otimização nos teus orçamentos.`
      : "Os teus orçamentos parecem equilibrados.",
  };
}