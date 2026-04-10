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

    // Run both queries in parallel
    const [transactionsRes, budgetsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, description, amount, type, category, date")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false }),
      supabase
        .from("budgets")
        .select("category, limit_amount")
        .eq("user_id", user.id)
    ]);

    if (transactionsRes.error) {
      return NextResponse.json({ error: transactionsRes.error.message }, { status: 400 });
    }

    const transactions = transactionsRes.data || [];
    const budgets = budgetsRes.data || [];

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
    };

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Report API error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}