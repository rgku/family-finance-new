import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Não autenticado",
        details: authError?.message 
      }, { status: 401 });
    }
    
    // Get request body
    const { title, body, url = '/dashboard', type = 'test' } = await request.json();
    
    // Create in-app notification using RPC function
    const { data: notificationId, error: notifError } = await supabase
      .rpc('create_notification', {
        p_user_id: user.id,
        p_title: title || 'Test Notification',
        p_body: body || 'This is a test notification',
        p_url: url,
        p_type: type,
      });
    
    if (notifError) {
      console.error('Error creating notification:', notifError);
      return NextResponse.json({ 
        error: "Erro ao criar notificação",
        details: notifError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      notificationId,
      message: "Notificação criada com sucesso!"
    });
  } catch (error: unknown) {
    console.error("Test notification API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Erro interno",
      details: message
    }, { status: 500 });
  }
}
