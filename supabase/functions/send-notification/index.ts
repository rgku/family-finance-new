import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, title, body, url, type } = await req.json();

    if (!userId || !title || !body) {
      throw new Error('Missing required fields: userId, title, body');
    }

    // Create Supabase client
    const supabaseClient = createSupabaseClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check user's notification preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
    }

    // Check if user wants this type of notification
    if (preferences && type && preferences[type as keyof typeof preferences] === false) {
      console.log(`User ${userId} has disabled ${type} notifications`);
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'disabled_by_user' }),
        { headers: corsHeaders, status: 200 }
      );
    }

    // Create in-app notification
    const { data: notification, error: notifError } = await supabaseClient
      .rpc('create_notification', {
        p_user_id: userId,
        p_title: title,
        p_body: body,
        p_url: url || '/dashboard',
        p_type: type,
      });

    if (notifError) {
      throw notifError;
    }

    console.log(`Notification created for user ${userId}: ${title}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        notificationId: notification,
        sent: 1,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Supabase client creator (simplified)
function createSupabaseClient(url: string, key: string) {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const response = await fetch(
              `${url}/rest/v1/${table}?${column}=eq.${value}`,
              {
                headers: {
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                  Prefer: 'return=representation',
                },
              }
            );
            const data = await response.json();
            return { data: data[0], error: null };
          },
        }),
      }),
      rpc: async (fn: string, params: any) => {
        const response = await fetch(
          `${url}/rest/v1/rpc/${fn}`,
          {
            method: 'POST',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(params),
          }
        );
        const data = await response.json();
        return { data, error: null };
      },
    }),
  };
}
