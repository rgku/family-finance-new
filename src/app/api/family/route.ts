import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const familySchema = z.object({
  name: z.string().max(100).trim().optional(),
  action: z.enum(["create", "join"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const parsed = familySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    
    const { name, action } = parsed.data;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (action === "create") {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("Attempting to create family for user:", user.id);
      
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({ name: name || "Minha Família", invite_code: inviteCode })
        .select()
        .single();

      console.log("Family insert result:", { family, familyError });

      if (familyError) {
        return NextResponse.json({ error: familyError.message }, { status: 400 });
      }

      console.log("Updating profile for user:", user.id, "with family_id:", family.id);
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: family.id, role: "owner" })
        .eq("id", user.id);

      console.log("Profile update result:", profileError);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({ family, inviteCode });
    } else if (action === "join") {
      const inviteCode = typeof name === 'string' ? name.toUpperCase().slice(0, 6) : "";
      
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (familyError || !family) {
        return NextResponse.json(
          { error: "Código de convite inválido" },
          { status: 400 }
        );
      }

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
  } catch (error: any) {
    console.error("Family API error:", error?.message || "Unknown error");
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
  } catch (error: any) {
    console.error("Family GET error:", error?.message || "Unknown error");
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}