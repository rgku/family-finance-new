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
    const { months = 12, memberId } = body;

    // Get user's family_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile for export:", profileError);
    }

    const familyId = profile?.family_id;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - months);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    // If memberId is provided (owner removing member), export ALL family data
    // Otherwise, export current user's own + family data
    let transactionQuery = supabase
      .from("transactions_decrypted")
      .select("*")
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: false });

    if (memberId && familyId) {
      // Export all family transactions for removed member
      transactionQuery = transactionQuery.eq("family_id", familyId);
    } else if (familyId) {
      // Export user's own + family
      transactionQuery = transactionQuery.or(`user_id.eq.${user.id},family_id.eq.${familyId}`);
    } else {
      // No family, just user's own
      transactionQuery = transactionQuery.eq("user_id", user.id);
    }

    const { data: transactions, error: transError } = await transactionQuery;

    if (transError) {
      console.error("Error fetching transactions:", transError);
    }

    // Generate CSV - only transactions, headers + data rows
    const csvRows: string[] = [];
    csvRows.push("id,user_id,family_id,data,descricao,categoria,tipo,valor,criado_em");
    
    if (transactions && transactions.length > 0) {
      for (const t of transactions) {
        const signedAmount = t.type === "expense" ? -Math.abs(t.amount) : Math.abs(t.amount);
        csvRows.push(
          `"${t.id}",` +
          `"${t.user_id}",` +
          `"${t.family_id || ""}",` +
          `"${t.date}",` +
          `"${(t.description || "").replace(/"/g, '""')}",` +
          `"${(t.category || "Outros").replace(/"/g, '""')}",` +
          `"${t.type}",` +
          `"${signedAmount}",` +
          `"${t.created_at || ""}"`
        );
      }
    }

    const csvContent = csvRows.join("\n");
    const userIdPart = memberId ? `familia-${familyId?.slice(0, 8) || "no-family"}` : user.id.slice(0, 8);
    const filename = `famflow-historico-${userIdPart}-${endDateStr}.csv`;

    return NextResponse.json({
      success: true,
      csv: csvContent,
      filename,
      stats: {
        transactions: transactions?.length || 0,
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
