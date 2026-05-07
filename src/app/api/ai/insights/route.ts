import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminSupabase } from "@/lib/supabase/server";
import { groqChatJSON } from "@/lib/ai/groq";
import { buildInsightsPrompt } from "@/lib/ai/prompts";
import { AIInsightsPayload, AIInsightItem } from "@/lib/ai/types";
import { validateDataQuality, detectOutliers, getDaysRemainingInMonth, isWeekend } from "@/lib/ai/dataQuality";
import { validateInsights } from "@/lib/ai/validateOutput";

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

    if (refresh) {
      await admin
        .from("ai_insights")
        .delete()
        .eq("user_id", user.id)
        .eq("month", monthParam)
        .eq("type", "anomalies");
    }

    const [profileResult, transResult, budgetsResult, goalsResult] = await Promise.all([
      supabase.from("profiles").select("family_id, billing_cycle_day").eq("id", user.id).single(),
      supabase.from("transactions_decrypted").select("amount, type, category, date"),
      supabase.from("budgets").select("category, limit_amount").eq("user_id", user.id),
      supabase.from("goals_decrypted").select("name, target_amount, current_amount, deadline, goal_type, created_at").eq("user_id", user.id),
    ]);

    if (profileResult.error) {
      console.error("Profile query error:", profileResult.error.message);
    }
    
    if (transResult.error) {
      console.error("Transactions query error:", transResult.error.message);
    }
    
    if (budgetsResult.error) {
      console.error("Budgets query error:", budgetsResult.error.message);
    }
    
    if (goalsResult.error) {
      console.error("Goals query error:", goalsResult.error.message);
    }

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
      // Billing cycle: from billingDay of PREVIOUS month to billingDay of current month - 1
      // Example: monthParam=2026-05, billingDay=29 → 2026-04-29 to 2026-05-28
      let cycleStart = new Date(year, monthNum - 2, billingDay);
      let cycleEnd = new Date(year, monthNum - 1, billingDay);
      if (monthNum === 1) cycleStart = new Date(year - 1, 11, billingDay);
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

    const monthGoals = (goalsResult.data || []).filter((g) => {
      if (!g.created_at) return false;
      const goalDate = new Date(g.created_at);
      const isInMonth = goalDate.getFullYear() === year && goalDate.getMonth() === monthNum - 1;
      console.log(`[Goal] ${g.name}: created_at=${g.created_at}, isInMonth=${isInMonth}`);
      return isInMonth;
    });

    const savingsAllocated = monthGoals
      .filter((g) => g.goal_type === "savings")
      .reduce((s, g) => s + Number(g.current_amount), 0);

    console.log(`[AI Insights] Month: ${monthParam}`);
    console.log(`[AI Insights] Total goals: ${(goalsResult.data || []).length}`);
    console.log(`[AI Insights] Month goals: ${monthGoals.length}`);
    console.log(`[AI Insights] Savings allocated (this month only): €${savingsAllocated.toFixed(2)}`);
    console.log(`[AI Insights] Income: €${income.toFixed(2)}`);
    console.log(`[AI Insights] Expenses: €${expenses.toFixed(2)}`);
    console.log(`[AI Insights] Balance: €${balance.toFixed(2)}`);

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

    const goals = (goalsResult.data || []).map((g) => ({
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

    // Detect subscriptions from transactions
    const subscriptionData = detectSubscriptions(transResult.data || []);

    // Data Quality Validation
    const basePayload: AIInsightsPayload = {
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
      subscriptions: subscriptionData.activeCount > 0 ? subscriptionData : undefined,
    };

    // Validate data quality
    const dataQuality = validateDataQuality(basePayload);
    const outliers = detectOutliers(monthTransactions);

    // Add metadata
    const payload: AIInsightsPayload = {
      ...basePayload,
      metadata: {
        dataQuality: dataQuality.overall,
        outliersCount: outliers.length,
        categoriesUsed: [...new Set(budgets.map(b => b.category))],
        dayOfMonth: new Date().getDate(),
        daysRemaining: getDaysRemainingInMonth(),
        isWeekend: isWeekend(),
      }
    };

    let insights: AIInsightItem[];
    try {
      // If data quality is low, use fallback only
      if (dataQuality.overall === "low") {
        console.warn("Data quality low, using fallback only");
        insights = generateFallbackInsights(payload);
      } else {
        insights = await generateInsights(payload);
        
        // Validate AI output
        const validation = validateInsights(insights, payload);
        
        if (!validation.valid) {
          console.warn("AI output validation failed", validation.errors);
          insights = generateFallbackInsights(payload);
        }
      }
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
    for (const b of overBudget.slice(0, 3)) {
      const percentage = Math.round((b.spent / b.limit) * 100);
      if (percentage >= 100) {
        insights.push({
          type: "warning",
          title: `${b.category} ultrapassado`,
          description: `Gastaste €${b.spent.toFixed(2)} de €${b.limit.toFixed(2)} (${percentage}%). Orçamento excedido!`,
        });
      } else if (percentage >= 80) {
        insights.push({
          type: "warning",
          title: `${b.category} quase esgotado`,
          description: `Gastaste €${b.spent.toFixed(2)} de €${b.limit.toFixed(2)} (${percentage}%). Atenção!`,
        });
      }
    }
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

  // Subscription insights (fallback)
  if (data.subscriptions && data.subscriptions.zombieInsight) {
    const { name, amount, daysSinceLastCharge } = data.subscriptions.zombieInsight;
    insights.push({
      type: "warning" as const,
      title: "Subscription inativa",
      description: `${name} sem uso há ${daysSinceLastCharge} dias. Poupança potencial: €${(amount * 12).toFixed(2)}/ano`,
    });
  }

  return insights;
}

interface TransactionRow {
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
  type?: string;
}

const SUBSCRIPTION_KEYWORDS = [
  "netflix", "spotify", "disney", "hbo", "amazon prime", "apple tv",
  "youtube premium", "youtube music", "tidal", "deezer", "xbox", "playstation",
  "adobe", "microsoft 365", "dropbox", "icloud", "google one", "vpn", "nordvpn",
];

function detectSubscriptions(transactions: TransactionRow[]): {
  activeCount: number;
  totalMonthly: number;
  totalYearly: number;
  zombieCount: number;
  potentialSavings: number;
  zombieInsight?: { name: string; amount: number; daysSinceLastCharge: number };
} {
  const now = new Date();

  const subscriptionTransactions = transactions.filter(t => {
    if (t.type !== "expense") return false;
    const desc = (t.description || "").toLowerCase();
    const cat = (t.category || "").toLowerCase();
    return SUBSCRIPTION_KEYWORDS.some(kw => desc.includes(kw) || cat.includes(kw));
  });

  if (subscriptionTransactions.length === 0) {
    return { activeCount: 0, totalMonthly: 0, totalYearly: 0, zombieCount: 0, potentialSavings: 0 };
  }

  const grouped = new Map<string, { amount: number; lastDate: string; count: number }>();
  
  subscriptionTransactions.forEach(t => {
    const key = t.description || t.category || "unknown";
    const existing = grouped.get(key);
    if (existing) {
      if (new Date(t.date || "") > new Date(existing.lastDate)) {
        existing.lastDate = t.date || "";
      }
      existing.amount = Number(t.amount);
      existing.count++;
    } else {
      grouped.set(key, {
        amount: Number(t.amount),
        lastDate: t.date || "",
        count: 1,
      });
    }
  });

  let activeCount = 0;
  let totalMonthly = 0;
  let zombieCount = 0;
  let potentialSavings = 0;
  let oldestZombie: { name: string; amount: number; daysSinceLastCharge: number } | undefined;

  grouped.forEach((data, name) => {
    if (data.count > 1) activeCount++;
    const daysSinceLastCharge = Math.floor(
      (now.getTime() - new Date(data.lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCharge > 60 || data.count === 1) {
      zombieCount++;
      potentialSavings += data.amount;
      if (!oldestZombie || daysSinceLastCharge > oldestZombie.daysSinceLastCharge) {
        oldestZombie = {
          name: name.split(" ")[0],
          amount: data.amount,
          daysSinceLastCharge,
        };
      }
    }

    totalMonthly += data.amount;
  });

  return {
    activeCount,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    zombieCount,
    potentialSavings,
    zombieInsight: oldestZombie,
  };
}