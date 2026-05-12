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
    maxTokens: 2048,
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

      if (cached.error) {
        console.error("Cache query error for optimize:", cached.error);
      }

      if (cached.data && cached.data.suggested_at) {
        const cacheAge = Date.now() - new Date(cached.data.suggested_at).getTime();
        if (cacheAge < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
          const rawSuggestions: any[] = cached.data.suggestions || [];
          const suggestions = rawSuggestions
            .map((s: any) => ({
              category: (s.category || s.categoria || s.name || "") as string,
              currentLimit: s.currentLimit ?? s.current_limit ?? 0,
              suggestedLimit: s.suggestedLimit ?? s.suggested_limit ?? 0,
              reason: (s.reason || "") as string,
              impactOnGoals: (s.impactOnGoals || s.impact_on_goals || "") as string,
            }))
            .filter(s => s.category.trim());
          return NextResponse.json({ suggestions, summary: cached.data.summary, cached: true, generated_at: cached.data.suggested_at });
        }
      }
    }

    const profileResult = await supabase.from("profiles").select("family_id").eq("id", user.id).single();
    const familyId = profileResult.data?.family_id;
    const txFilter = familyId
      ? `user_id.eq.${user.id},family_id.eq.${familyId}`
      : `user_id.eq.${user.id}`;

    const [budgetsResult, goalsResult, transResult] = await Promise.all([
      supabase.from("budgets").select("category, limit_amount").eq("user_id", user.id),
      supabase.from("goals_decrypted").select("name, target_amount, current_amount, deadline").or(txFilter),
      supabase.from("transactions_decrypted").select("amount, type, category, date").or(txFilter).order("date", { ascending: false }).limit(500),
    ]);

    if (profileResult.error) {
      console.error("Profile query error:", profileResult.error.message);
    }
    
    if (budgetsResult.error) {
      console.error("Budgets query error:", budgetsResult.error.message);
    }
    
    if (goalsResult.error) {
      console.error("Goals query error:", goalsResult.error.message);
    }
    
    if (transResult.error) {
      console.error("Transactions query error:", transResult.error.message);
    }

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
      .or(txFilter)
      .eq("type", "income")
      .gte("date", `${currentMonth}-01`)
      .lt("date", `${currentMonth}-32`);

    const totalIncome = (incomeResult.data || []).reduce((s, t) => s + Number(t.amount), 0);

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

    const rawSuggestions: any[] = result.suggestions || [];
    const validSuggestions: AIBudgetSuggestion[] = rawSuggestions
      .map((s: any) => ({
        category: (s.category || s.categoria || s.name || "") as string,
        currentLimit: (s.currentLimit ?? s.current_limit ?? 0) as number,
        suggestedLimit: (s.suggestedLimit ?? s.suggested_limit ?? 0) as number,
        reason: (s.reason || "") as string,
        impactOnGoals: (s.impactOnGoals || s.impact_on_goals || "") as string,
      }))
      .filter(s => s.category.trim());
    result.suggestions = validSuggestions;

    if (result.suggestions.length > 0) {
      try {
        await admin.from("budget_suggestions").insert({
          user_id: user.id,
          suggestions: result.suggestions,
          summary: result.summary,
        });
      } catch (insertErr) {
        console.warn("Failed to cache budget suggestions:", insertErr);
      }
    }

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
      const pct = Math.round(ratio * 100);
      if (ratio > 1.1) {
        suggestions.push({
          category: b.category,
          currentLimit: b.limit,
          suggestedLimit: Math.round(b.spent * 1.1),
          reason: `Gastas habitualmente ${pct}% do budget. Aumentar o limite evita estouros recorrentes.`,
          impactOnGoals: "Evita notificações de alerta e mantém o controlo.",
        });
      } else if (ratio < 0.6 && b.limit > 50) {
        suggestions.push({
          category: b.category,
          currentLimit: b.limit,
          suggestedLimit: Math.round(b.limit * 0.85),
          reason: `Usas apenas ${pct}% do budget. Podes reduzir e realocar para poupança.`,
          impactOnGoals: "O valor libertado pode acelerar as tuas metas de poupança.",
        });
      } else {
        suggestions.push({
          category: b.category,
          currentLimit: b.limit,
          suggestedLimit: b.limit,
          reason: ratio >= 0.9 ? `Estás a usar ${pct}% — o limite está bem ajustado.` : `Uso de ${pct}% — mantém o limite atual.`,
          impactOnGoals: "Orçamento equilibrado. Continua assim.",
        });
      }
    }
  });

  return {
    suggestions: suggestions.slice(0, 8),
    summary: suggestions.length > 0
      ? `Análise concluída para ${suggestions.length} categoria(s).`
      : "Os teus orçamentos parecem equilibrados.",
  };
}