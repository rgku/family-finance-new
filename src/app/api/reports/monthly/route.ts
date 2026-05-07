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
    const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate = monthNum === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;

    // Previous month calculation
    const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}-01`;
    const prevEndDate = monthNum === 1 
      ? `${prevYear + 1}-01-01` 
      : `${prevYear}-${String(monthNum).padStart(2, "0")}-01`;

    // Run queries in parallel
    const [transactionsRes, budgetsRes, prevTransactionsRes] = await Promise.all([
      supabase
        .from("transactions_decrypted")
        .select("id, description, amount, type, category, date")
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