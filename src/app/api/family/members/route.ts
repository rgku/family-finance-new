import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["member", "view_only"]).default("member"),
});

const updateSchema = z.object({
  memberId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["member", "view_only"]).optional(),
  action: z.enum(["update", "remove"]),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

// Get user's profile to find their family
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('family_id, role, tier, member_limit')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile?.family_id) {
      console.log('User profile:', profile);
      return NextResponse.json({ 
        members: [], 
        family: null,
        memberLimit: profile?.member_limit || 1,
        currentCount: 0 
      });
    }

    // Get family info
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .eq("id", profile.family_id)
      .single();

// Get all family members (from family_members table)
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: true });

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 400 });
    }

    // Get all family members from profiles table (owner + partner + members)
    const { data: profileMembers, error: profileMembersError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('family_id', profile.family_id);

    // Combine family_members with profile members
    const allMembers = [...(members || [])];

    // Add profile members that aren't already in family_members
    if (profileMembers) {
      for (const pm of profileMembers) {
        if (!allMembers.find(m => m.user_id === pm.id)) {
          allMembers.unshift({
            id: pm.id,
            family_id: profile.family_id,
            user_id: pm.id,
            name: pm.full_name || 'Membro',
            email: '',
            role: pm.role,
            status: 'active',
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      members: allMembers,
      family,
      memberLimit: profile.member_limit || 1,
      currentCount: allMembers.length,
      userRole: profile.role,
    });
  } catch (error: any) {
    console.error("Family members GET error:", error?.message || "Unknown error");
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

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role, tier, member_limit")
      .eq("id", user.id)
      .single();
    
    if (!profile?.family_id) {
      return NextResponse.json({ error: "Não pertence a uma família" }, { status: 400 });
    }

    // Check if user can invite (must be owner or member)
    if (!["owner", "member"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão para convidar membros" }, { status: 403 });
    }

    // Count current members
    const { count: currentCount } = await supabase
      .from("family_members")
      .select("*", { count: "exact", head: true })
      .eq("family_id", profile.family_id);

    if (currentCount && currentCount >= (profile.member_limit || 1)) {
      return NextResponse.json({ 
        error: `Limite atingido. Faça upgrade para adicionar mais membros.` 
      }, { status: 403 });
    }

    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.issues }, { status: 400 });
    }

    const { name, email, role } = parsed.data;
    const inviteToken = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create invitation
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: profile.family_id,
        user_id: user.id,
        name,
        email,
        role,
        status: "pending",
        invite_token: inviteToken,
      })
      .select()
      .single();

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      member, 
      inviteCode: inviteToken,
      message: `Convite criado. Código: ${inviteToken}`
    });
  } catch (error: any) {
    console.error("Family members POST error:", error?.message || "Unknown error");
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

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.family_id) {
      return NextResponse.json({ error: "Não pertence a uma família" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { memberId, name, role: newRole, action } = parsed.data;

    // Check permission
    if (profile.role !== "owner" && profile.role !== "member") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (action === "update") {
      const updateData: Record<string, string> = {};
      if (name) updateData.name = name;
      if (newRole) updateData.role = newRole;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("family_members")
        .update(updateData)
        .eq("id", memberId)
        .eq("family_id", profile.family_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Membro atualizado" });
    } 
    
    if (action === "remove") {
      // Only owner can remove
      if (profile.role !== "owner") {
        return NextResponse.json({ error: "Apenas o owner pode remover membros" }, { status: 403 });
      }

      const { error: deleteError } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId)
        .eq("family_id", profile.family_id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Membro removido" });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Family members PATCH error:", error?.message || "Unknown error");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}