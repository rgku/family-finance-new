import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    console.log('=== SEND-PUSH FUNCTION START ===');
    
    // Parse request
    const payload: PushPayload = await req.json();
    const { user_id, title, body, url, type } = payload;
    
    console.log('Received payload:', { user_id, title, body, type });

    if (!user_id || !title || !body) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
    const onesignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceRole: !!supabaseServiceRole,
      hasAppId: !!onesignalAppId,
      hasApiKey: !!onesignalApiKey
    });

    if (!onesignalAppId || !onesignalApiKey) {
      console.error('OneSignal credentials not configured');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Get user's OneSignal player ID
    console.log('Fetching OneSignal player ID for user:', user_id);
    const { data: subscription, error: fetchError } = await supabase
      .from('onesignal_subscriptions')
      .select('onesignal_player_id')
      .eq('user_id', user_id)
      .eq('subscription_state', 'active')
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
    }
    
    console.log('Subscription result:', { subscription, hasError: !!fetchError });

    if (fetchError || !subscription) {
      console.log('User not subscribed to push notifications');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User not subscribed to push notifications',
          skipped: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Found OneSignal player ID:', subscription.onesignal_player_id);

    // Send push notification via OneSignal API
    console.log('Sending push via OneSignal API...');
    const onesignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${onesignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: onesignalAppId,
        include_player_ids: [subscription.onesignal_player_id],
        headings: { en: title },
        contents: { en: body },
        url: url || '/dashboard/alerts',
        data: {
          type: type || 'generic',
          user_id: user_id,
        },
      }),
    });

    console.log('OneSignal API response status:', onesignalResponse.status);
    const onesignalData = await onesignalResponse.json();
    console.log('OneSignal API response data:', onesignalData);

    if (!onesignalResponse.ok) {
      console.error('OneSignal API error:', onesignalData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send push notification',
          details: onesignalData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Push notification sent:', onesignalData);

    // Also create in-app notification in database
    console.log('Creating in-app notification...');
    try {
      const { data: notificationId, error: notifError } = await supabase
        .rpc('create_notification', {
          p_user_id: user_id,
          p_title: title,
          p_body: body,
          p_url: url || '/dashboard',
          p_type: type || 'generic',
        });

      if (notifError) {
        console.error('Error creating in-app notification:', notifError);
      } else {
        console.log('✅ In-app notification created:', notificationId);
      }
    } catch (dbError: any) {
      console.error('Database error creating notification:', dbError.message);
      // Don't fail the request if in-app notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent',
        onesignal_response: onesignalData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
