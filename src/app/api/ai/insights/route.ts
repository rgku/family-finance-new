import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminSupabase } from "@/lib/supabase/server";
import { groqChatJSON } from "@/lib/ai/groq";
import { buildInsightsPrompt } from "@/lib/ai/prompts";
import { AIInsightsPayload, AIInsightItem } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_HOURS = 24;

async function generateInsights(data: AIInsightsPayload) {
  const prompt = buildInsightsPrompt(data);
  const result = await groqChatJSON<{ insights: AIInsightItem[] }>({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 1024,
  });
  return result.insights;
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
    const refresh = searchParams.get("refresh") === "1";

    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: "Parâmetro month é obrigatório (YYYY-MM)" }, { status: 400 });
    }

    const admin = await createAdminSupabase();

    if (!refresh) {
      const cached = await admin
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", monthParam)
        .eq("type", "anomalies")
        .single();

      if (cached.data && cached.data.generated_at) {
        const cacheAge = Date.now() - new Date(cached.data.generated_at).getTime();
        if (cacheAge < CACHE_TTL_HOURS * 60 * 60 * 1000) {
          return NextResponse.json({ insights: cached.data.content, cached: true, generated_at: cached.data.generated_at });
        }
      }
    }

    const [profileResult, transResult, budgetsResult, goalsResult] = await Promise.all([
      supabase.from("profiles").select("family_id, billing_cycle_day").eq("id", user.id).single(),
      supabase.from("transactions").select("amount, type, category, date").eq("user_id", user.id),
      supabase.from("budgets").select("category, limit_amount").eq("user_id", user.id),
      supabase.from("goals").select("name, target_amount, current_amount, deadline, goal_type").eq("user_id", user.id),
    ]);

    if (!profileResult.data) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const [year, monthNum] = monthParam.split("-").map(Number);
    const billingDay = profileResult.data.billing_cycle_day || 1;

    function isInMonth(dateStr: string): boolean {
      if (billingDay === 1) {
        const d = new Date(dateStr);
        return d.getFullYear() === year && d.getMonth() === monthNum - 1;
      }
      const cycleStart = new Date(year, monthNum - 1, billingDay);
      let cycleEnd = new Date(year, monthNum, billingDay);
      if (monthNum === 12) cycleEnd = new Date(year + 1, 0, billingDay);
      const d = new Date(dateStr);
      return d >= cycleStart && d < cycleEnd;
    }

    const monthTransactions = transResult.data?.filter(t => isInMonth(t.date)) || [];
    const income = monthTransactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    const investmentExpenses = monthTransactions
      .filter(t => t.type === "expense" && t.category === "Investimentos")
      .reduce((s, t) => s + Number(t.amount), 0);

    const normalExpenses = monthTransactions
      .filter(t => t.type === "expense" && t.category !== "Investimentos")
      .reduce((s, t) => s + Number(t.amount), 0);

    const savingsAllocated = (goalsResult.data || [])
      .filter((g: any) => g.goal_type === "savings")
      .reduce((s, g) => s + Number(g.current_amount), 0);

    const pouparanca = savingsAllocated + investmentExpenses;
    const expenses = normalExpenses;
    const balance = income - normalExpenses - pouparanca;

    const categorySpending: Record<string, number> = {};
    monthTransactions.filter(t => t.type === "expense").forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });

    const budgets = budgetsResult.data?.map(b => ({
      category: b.category,
      limit: Number(b.limit_amount),
      spent: monthTransactions.filter(t => t.category === b.category && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    })) || [];

    const goals = (goalsResult.data || []).map((g: any) => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      deadline: g.deadline,
    }));

    const prevMonth = monthNum === 1 ? { year: year - 1, month: 12 } : { year, month: monthNum - 1 };
    const prevTransactions = transResult.data?.filter(t => {
      if (billingDay === 1) {
        const d = new Date(t.date);
        return d.getFullYear() === prevMonth.year && d.getMonth() === prevMonth.month - 1;
      }
      const prevStart = new Date(prevMonth.year, prevMonth.month - 1, billingDay);
      let prevEnd = new Date(prevMonth.year, prevMonth.month, billingDay);
      if (prevMonth.month === 12) prevEnd = new Date(prevMonth.year + 1, 0, billingDay);
      const d = new Date(t.date);
      return d >= prevStart && d < prevEnd;
    }) || [];

    const previousMonthSpending: Record<string, number> = {};
    prevTransactions.filter(t => t.type === "expense").forEach(t => {
      previousMonthSpending[t.category] = (previousMonthSpending[t.category] || 0) + Number(t.amount);
    });

    const payload: AIInsightsPayload = {
      month: monthParam,
      income,
      expenses,
      pouparanca,
      balance,
      categorySpending,
      budgets,
      goals,
      transactionsCount: monthTransactions.length,
      previousMonthSpending: Object.keys(previousMonthSpending).length > 0 ? previousMonthSpending : undefined,
      billingCycleDay: billingDay,
    };

    let insights: AIInsightItem[];
    try {
      insights = await generateInsights(payload);
    } catch (aiError) {
      console.warn("AI insights generation failed, using fallback:", aiError);
      insights = generateFallbackInsights(payload);
    }

    await admin.from("ai_insights").upsert({
      user_id: user.id,
      month: monthParam,
      type: "anomalies",
      content: insights,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,month,type",
    });

    return NextResponse.json({ insights, cached: false, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function generateFallbackInsights(data: AIInsightsPayload): AIInsightItem[] {
  const insights: AIInsightItem[] = [];

  if (data.balance >= 0) {
    insights.push({
      type: "success",
      title: "Saldo positivo este mês",
      description: `Conseguiste poupar €${data.balance.toFixed(2)} este mês. Continua assim!`,
    });
  } else {
    insights.push({
      type: "warning",
      title: "Saldo negativo este mês",
      description: `Gastaste €${Math.abs(data.balance).toFixed(2)} a mais do que tinhas disponível.`,
    });
  }

  const overBudget = data.budgets.filter(b => b.limit > 0 && (b.spent / b.limit) >= 0.8);
  if (overBudget.length > 0) {
    insights.push({
      type: "warning",
      title: "Orçamentos quase esgotados",
      description: `${overBudget.length} categoria(s) a atingir 80%+ do orçamento: ${overBudget.map(b => b.category).join(", ")}.`,
    });
  }

  const topCategories = Object.entries(data.categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  if (topCategories.length > 0) {
    const [cat, amt] = topCategories[0];
    insights.push({
      type: "tip",
      title: `Maior gasto: ${cat}`,
      description: `Gastaste €${amt.toFixed(2)} em ${cat}, o que representa ${data.expenses > 0 ? Math.round((amt / data.expenses) * 100) : 0}% das despesas totais.`,
    });
  }

  if (data.goals.length > 0) {
    const bestGoal = data.goals
      .filter(g => g.current > 0)
      .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];
    if (bestGoal) {
      insights.push({
        type: "info",
        title: "Meta a progredir",
        description: `"${bestGoal.name}" está a ${Math.round((bestGoal.current / bestGoal.target) * 100)}% — vais conseguir!`,
      });
    }
  }

  return insights;
}