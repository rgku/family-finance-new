import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [year, monthNum] = month.split("-").map(Number);

    // Get transactions for the month
    const { data: transactions, error: transError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", `${year}-${String(monthNum).padStart(2, "0")}-01`)
      .lt("date", monthNum === 12 
        ? `${year + 1}-01-01` 
        : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`)
      .order("date", { ascending: false });

    if (transError) {
      return NextResponse.json({ error: transError.message }, { status: 400 });
    }

    // Get budgets
    const { data: budgets } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    // Calculate budget spent
    const budgetData = budgets?.map(b => {
      const spent = transactions
        ?.filter(t => t.category === b.category && t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      return {
        category: b.category,
        limit: Number(b.limit_amount),
        spent,
      };
    }) || [];

    const income = transactions
      ?.filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const expenses = transactions
      ?.filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

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
      transactions: transactions?.map(t => ({
        ...t,
        amount: Number(t.amount),
      })) || [],
    };

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Report API error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}