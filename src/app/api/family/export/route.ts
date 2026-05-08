import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { months = 12, includeGoals = true, includeBudgets = true, memberId } = body;

    // If memberId is provided, export data for that specific member (owner action)
    const targetUserId = memberId || user.id;

    // Get user's family_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    const familyId = profile?.family_id;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - months);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    // Fetch transactions (target user's own + family)
    let transactionQuery = supabase
      .from("transactions_decrypted")
      .select("*")
      .eq("user_id", targetUserId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: false });

    if (familyId) {
      transactionQuery = transactionQuery.or(`family_id.eq.${familyId}`);
    }

    const { data: transactions, error: transError } = await transactionQuery;

    if (transError) {
      console.error("Error fetching transactions:", transError);
    }

    // Fetch goals
    let goalsData = [];
    if (includeGoals) {
      let goalsQuery = supabase
        .from("goals_decrypted")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (familyId) {
        goalsQuery = goalsQuery.or(`family_id.eq.${familyId}`);
      }

      const { data: goals } = await goalsQuery;
      goalsData = goals || [];
    }

    // Fetch budgets
    let budgetsData = [];
    if (includeBudgets) {
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", targetUserId)
        .gte("month", startDateStr)
        .lte("month", endDateStr)
        .order("month", { ascending: false });

      budgetsData = budgets || [];
    }

    // Generate CSV
    const csvRows: string[] = [];

    // Header
    csvRows.push("=== FAMFLOW HISTORY EXPORT ===");
    csvRows.push(`Export Date: ${now.toISOString()}`);
    csvRows.push(`User ID: ${user.id}`);
    csvRows.push(`Family ID: ${familyId || "N/A"}`);
    csvRows.push(`Period: ${startDateStr} to ${endDateStr} (${months} months)`);
    csvRows.push("");

    // Transactions
    csvRows.push("=== TRANSAÇÕES ===");
    csvRows.push("ID,user_id,family_id,Data,Descrição,Categoria,Tipo,Valor,Criado Em");
    
    if (transactions && transactions.length > 0) {
      for (const t of transactions) {
        csvRows.push(
          `"${t.id}",` +
          `"${t.user_id}",` +
          `"${t.family_id || ""}",` +
          `"${t.date}",` +
          `"${(t.description || "").replace(/"/g, '""')}",` +
          `"${(t.category || "Outros").replace(/"/g, '""')}",` +
          `"${t.type}",` +
          `"${t.amount}",` +
          `"${t.created_at || ""}"`
        );
      }
    }
    
    csvRows.push(`Total: ${transactions?.length || 0} transações`);
    csvRows.push("");

    // Goals
    if (includeGoals && goalsData.length > 0) {
      csvRows.push("=== METAS ===");
      csvRows.push("ID,user_id,family_id,Nome,Meta Atual,Meta Alvo,Prazo,Tipo,Ícone,Criado Em");
      
      for (const g of goalsData) {
        csvRows.push(
          `"${g.id}",` +
          `"${g.user_id}",` +
          `"${g.family_id || ""}",` +
          `"${(g.name || "").replace(/"/g, '""')}",` +
          `"${g.current_amount}",` +
          `"${g.target_amount}",` +
          `"${g.deadline || ""}",` +
          `"${g.goal_type || "savings"}",` +
          `"${g.icon || ""}",` +
          `"${g.created_at || ""}"`
        );
      }
      
      csvRows.push(`Total: ${goalsData.length} metas`);
      csvRows.push("");
    }

    // Budgets
    if (includeBudgets && budgetsData.length > 0) {
      csvRows.push("=== ORÇAMENTOS ===");
      csvRows.push("ID,user_id,family_id,Categoria,Limite,Mês,Criado Em");
      
      for (const b of budgetsData) {
        csvRows.push(
          `"${b.id}",` +
          `"${b.user_id}",` +
          `"${b.family_id || ""}",` +
          `"${(b.category || "").replace(/"/g, '""')}",` +
          `"${b.limit_amount}",` +
          `"${b.month}",` +
          `"${b.created_at || ""}"`
        );
      }
      
      csvRows.push(`Total: ${budgetsData.length} orçamentos`);
    }

    // Create CSV blob
    const csvContent = csvRows.join("\n");
    const userIdPart = memberId ? `member-${memberId.slice(0, 8)}` : user.id.slice(0, 8);
    const filename = `famflow-historico-${userIdPart}-${endDateStr}.csv`;

    return NextResponse.json({
      success: true,
      csv: csvContent,
      filename,
      stats: {
        transactions: transactions?.length || 0,
        goals: goalsData.length,
        budgets: budgetsData.length,
        period: `${startDateStr} a ${endDateStr}`,
      },
    });
  } catch (error) {
    console.error("Export API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Erro ao exportar dados", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
