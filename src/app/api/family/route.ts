import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminSupabase } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { z } from "zod";

function generateSecureInviteCode(): string {
  return randomBytes(8).toString('hex').toUpperCase();
}

const familySchema = z.object({
  name: z.string().max(100).trim().optional(),
  action: z.enum(["create", "join"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminSupabase();
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
      const inviteCode = generateSecureInviteCode();

      // Use admin client to bypass RLS
      const { data: family, error: familyError } = await adminSupabase
        .from("families")
        .insert({ name: name || "Minha Família", invite_code: inviteCode })
        .select()
        .single();

      if (familyError) {
        return NextResponse.json({ error: familyError.message }, { status: 400 });
      }

      // Also use admin for profile update
      const { error: profileError } = await adminSupabase
        .from("profiles")
        .update({ family_id: family.id, role: "owner" })
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({ family, inviteCode });
    } else if (action === "join") {
      // Check if user already has a family
      const { data: existingProfile } = await adminSupabase
        .from("profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (existingProfile?.family_id) {
        return NextResponse.json(
          { error: "Já pertences a uma família. Sai primeiro para entrar noutra." },
          { status: 400 }
        );
      }

      const inviteCode = typeof name === 'string' ? name.toUpperCase().slice(0, 6) : "";
      
      // First, try to find by invite_code (family table)
      const { data: family, error: familyError } = await adminSupabase
        .from("families")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      let targetFamily = family;
      let newRole = "partner";

      // If not found by family invite_code, try to find by invite_token (member invitation)
      if (familyError || !family) {
        const { data: memberInvite, error: inviteError } = await adminSupabase
          .from("family_members")
          .select("*, families(*)")
          .eq("invite_token", inviteCode)
          .single();

        if (inviteError || !memberInvite) {
          return NextResponse.json(
            { error: "Código de convite inválido" },
            { status: 400 }
          );
        }

        // Check if invite is already used
        if (memberInvite.status === "active") {
          return NextResponse.json(
            { error: "Este convite já foi utilizado" },
            { status: 400 }
          );
        }

        targetFamily = memberInvite.families;
        newRole = memberInvite.role;

        // Mark invite as active
        await adminSupabase
          .from("family_members")
          .update({ status: "active", user_id: user.id })
          .eq("id", memberInvite.id);
      }

      if (!targetFamily) {
        return NextResponse.json(
          { error: "Código de convite inválido" },
          { status: 400 }
        );
      }

      const { error: profileError } = await adminSupabase
        .from("profiles")
        .update({ family_id: targetFamily.id, role: newRole })
        .eq("id", user.id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      // Also add to family_members table if not already there
      const { data: existingMember } = await adminSupabase
        .from("family_members")
        .select("id")
        .eq("family_id", targetFamily.id)
        .eq("user_id", user.id)
        .single();

      if (!existingMember) {
        await adminSupabase
          .from("family_members")
          .insert({
            family_id: targetFamily.id,
            user_id: user.id,
            name: user.email?.split("@")[0] || "Membro",
            email: user.email || "",
            role: newRole,
            status: "active",
          });
      }

      return NextResponse.json({ family: targetFamily, message: "Entrou na família com sucesso!" });
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