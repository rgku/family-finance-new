import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const alertSchema = z.object({
  category: z.string().min(1),
  threshold_percent: z.number().min(50).max(100).default(80),
  alert_type: z.enum(["warning", "exceeded"]).default("warning"),
  notify_email: z.boolean().default(true),
  notify_in_app: z.boolean().default(true),
});

const updateSchema = z.object({
  alertId: z.string().uuid(),
  threshold_percent: z.number().min(50).max(100).optional(),
  alert_type: z.enum(["warning", "exceeded"]).optional(),
  notify_email: z.boolean().optional(),
  notify_in_app: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: alerts, error } = await supabase
      .from("budget_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error: any) {
    console.error("Budget alerts GET error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const parsed = alertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { category, threshold_percent, alert_type, notify_email, notify_in_app } = parsed.data;

    const { data: alert, error } = await supabase
      .from("budget_alerts")
      .insert({
        user_id: user.id,
        category,
        threshold_percent,
        alert_type,
        notify_email,
        notify_in_app,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ alert, message: "Alerta criado com sucesso" });
  } catch (error: any) {
    console.error("Budget alerts POST error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { alertId, ...updateData } = parsed.data;

    const { error } = await supabase
      .from("budget_alerts")
      .update(updateData)
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Alerta atualizado" });
  } catch (error: any) {
    console.error("Budget alerts PATCH error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!alertId) {
      return NextResponse.json({ error: "ID do alerta é obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("budget_alerts")
      .delete()
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Alerta eliminado" });
  } catch (error: any) {
    console.error("Budget alerts DELETE error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}