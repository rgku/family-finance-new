import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, action } = body;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (action === "create") {
      // Create new family
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: name || "Minha Família", invite_code: inviteCode })
        .select()
        .single();

      if (familyError) {
        return NextResponse.json({ error: familyError.message }, { status: 400 });
      }

      // Update user profile to be owner of family
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: family.id, role: "owner" })
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({ family, inviteCode });
    } else if (action === "join") {
      // Join existing family via invite code
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("*")
        .eq("invite_code", name.toUpperCase())
        .single();

      if (familyError || !family) {
        return NextResponse.json(
          { error: "Código de convite inválido" },
          { status: 400 }
        );
      }

      // Update user profile to be partner
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: family.id, role: "partner" })
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({ family, message: "Entrou na família com sucesso!" });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Get user's profile with family info
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, families(*)")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile, family: profile?.families });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}