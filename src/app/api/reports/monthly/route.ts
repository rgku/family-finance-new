import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: "Parâmetro month inválido. Use o formato YYYY-MM" }, { status: 400 });
    }
    
    const month = monthParam;
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [year, monthNum] = month.split("-").map(Number);

    // Get family_id and billing_cycle_day
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, billing_cycle_day")
      .eq("id", user.id)
      .single();

    const familyId = profile?.family_id;
    const billingDay = profile?.billing_cycle_day || 1;

    // Calculate date range based on billing cycle
    // Example: monthParam=2026-05, billingDay=29 → 2026-04-29 to 2026-05-28
    let startDate: string;
    let endDate: string;
    
    if (billingDay === 1) {
      startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
      endDate = monthNum === 12 
        ? `${year + 1}-01-01` 
        : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;
    } else {
      // Billing cycle starts on billingDay of month-2
      // Example: month=06 (June), billingDay=24 → starts Apr 24
      const startMonth = monthNum <= 2 ? monthNum + 10 : monthNum - 2;
      const startYear = monthNum <= 2 ? year - 1 : year;
      startDate = `${startYear}-${String(startMonth).padStart(2, "0")}-${String(billingDay).padStart(2, "0")}`;
      
      // Billing cycle ends on billingDay+1 of month-1 (exclusive)
      // Example: month=06 (June), billingDay=24 → ends May 25 (exclusive = May 24 inclusive)
      const endMonth = monthNum === 1 ? 12 : monthNum - 1;
      const endYear = monthNum === 1 ? year - 1 : year;
      endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(billingDay).padStart(2, "0")}`;
      const endD = new Date(endDate);
      endD.setDate(endD.getDate() + 1);
      endDate = endD.toISOString().split("T")[0];
    }

    // Previous month calculation
    const prevStartD = new Date(startDate);
    prevStartD.setMonth(prevStartD.getMonth() - 1);
    const prevEndD = new Date(endDate);
    prevEndD.setMonth(prevEndD.getMonth() - 1);
    const prevStartDate = prevStartD.toISOString().split("T")[0];
    const prevEndDate = prevEndD.toISOString().split("T")[0];

    const txFilter = familyId
      ? `user_id.eq.${user.id},family_id.eq.${familyId}`
      : `user_id.eq.${user.id}`;

    // Run queries in parallel
    const [transactionsRes, budgetsRes, prevTransactionsRes] = await Promise.all([
      supabase
        .from("transactions_decrypted")
        .select("id, description, amount, type, category, date")
        .or(txFilter)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false }),
      supabase
        .from("budgets")
        .select("category, limit_amount")
        .eq("user_id", user.id),
      supabase
        .from("transactions_decrypted")
        .select("amount, type")
        .or(txFilter)
        .gte("date", prevStartDate)
        .lt("date", prevEndDate),
    ]);

    if (transactionsRes.error) {
      return NextResponse.json({ error: transactionsRes.error.message }, { status: 400 });
    }

    if (budgetsRes.error) {
      console.error("Budgets query error:", budgetsRes.error.message);
    }

    const transactions = transactionsRes.data || [];
    const budgets = budgetsRes.data || [];
    const prevTransactions = prevTransactionsRes.data || [];

    const budgetData = budgets.map(b => {
      const spent = transactions
        .filter(t => t.category === b.category && t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        category: b.category,
        limit: Number(b.limit_amount),
        spent,
      };
    });

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Category breakdown
    const categoryMap = new Map<string, number>();
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + Number(t.amount));
      });
    
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    })).sort((a, b) => b.amount - a.amount);

    // Previous month data
    const prevIncome = prevTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevExpenses = prevTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const reportData = {
      month: monthNames[monthNum - 1],
      year,
      income,
      expenses,
      balance: income - expenses,
      budget: budgetData,
      transactions: transactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: t.date,
      })),
      categoryBreakdown,
      previousMonth: {
        income: prevIncome,
        expenses: prevExpenses,
        balance: prevIncome - prevExpenses,
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Report API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}