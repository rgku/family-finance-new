import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log('=== TEST PUSH API START ===');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check:', { userId: user?.id, hasError: !!authError, error: authError?.message });
    
    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json({ 
        error: "Não autenticado",
        details: authError?.message 
      }, { status: 401 });
    }
    
    // Get user's OneSignal player ID
    const { data: subscription, error: subError } = await supabase
      .from('onesignal_subscriptions')
      .select('onesignal_player_id')
      .eq('user_id', user.id)
      .eq('subscription_state', 'active')
      .single();
    
    console.log('Subscription check:', { 
      hasSubscription: !!subscription, 
      playerId: subscription?.onesignal_player_id,
      hasError: !!subError,
      error: subError?.message 
    });
    
    if (subError || !subscription) {
      console.error('Subscription not found:', subError);
      return NextResponse.json({ 
        error: "Utilizador não subscrito",
        details: subError?.message 
      }, { status: 400 });
    }
    
    // Call Edge Function to send push notification
    console.log('Calling Edge Function send-push...');
    console.log('Payload:', {
      user_id: user.id,
      title: 'Test Notification',
      body: 'Push notifications are working!',
      type: 'test_notification',
    });
    
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        user_id: user.id,
        title: 'Test Notification',
        body: 'Push notifications are working!',
        type: 'test_notification',
        url: '/dashboard/alerts',
      },
    });
    
    console.log('Edge Function response:', { 
      hasData: !!data, 
      hasError: !!error,
      errorStatus: (error as { status?: number })?.status,
      errorMessage: (error as { message?: string })?.message,
      errorContext: (error as { context?: unknown })?.context,
    });
    
    if (error) {
      console.error('Edge Function error details:', JSON.stringify(error, null, 2));
      const err = error as { message?: string; status?: number };
      return NextResponse.json({ 
        error: "Erro ao enviar notificação",
        details: err.message,
        status: err.status,
        full_error: error
      }, { status: 500 });
    }
    
    console.log('✅ Test push notification sent successfully');
    console.log('📬 OneSignal Notification ID:', data?.onesignal_response?.id);
    console.log('📬 Check your browser notifications!');
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação de teste enviada! Verifica o teu browser.",
      data,
      debug: {
        onesignal_id: data?.onesignal_response?.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    console.error("Test push API error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      return NextResponse.json({ 
        error: "Erro interno",
        details: error.message,
        name: error.name,
        stack: error.stack
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: "Erro interno",
      details: "Unknown error"
    }, { status: 500 });
  }
}
