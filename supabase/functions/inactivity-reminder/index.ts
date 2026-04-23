import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== INACTIVITY REMINDER START ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    
    console.log(`Checking for users inactive since ${threeDaysAgoStr}`);

    // Get all active users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    console.log(`Processing ${users.users.length} users`);

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users.users) {
      processed++;
      
      try {
        // Check if user has inactivity_reminder enabled
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('inactivity_reminder')
          .eq('user_id', user.id)
          .single();

        // Skip if user disabled inactivity reminders
        if (preferences && preferences.inactivity_reminder === false) {
          console.log(`User ${user.id} disabled inactivity reminders, skipping`);
          skipped++;
          continue;
        }

        // Get user's last transaction
        const { data: lastTransaction, error: transError } = await supabase
          .from('transactions_decrypted')
          .select('date')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1);

        if (transError) {
          console.error(`Error fetching last transaction for user ${user.id}:`, transError);
          errors++;
          continue;
        }

        // Skip if no transactions at all (new user)
        if (!lastTransaction || lastTransaction.length === 0) {
          console.log(`User ${user.id} has no transactions, skipping`);
          skipped++;
          continue;
        }

        const lastDate = new Date(lastTransaction[0].date);
        const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`User ${user.id}: Last transaction ${daysSinceLast} days ago`);

        // Check if 3+ days since last transaction
        if (daysSinceLast >= 3) {
          // Check if we already sent an inactivity reminder in the last 3 days
          const { data: lastReminder } = await supabase
            .from('budget_alerts')
            .select('last_sent')
            .eq('user_id', user.id)
            .eq('alert_type', 'inactivity_reminder')
            .gte('last_sent', threeDaysAgoStr)
            .single();

          if (lastReminder) {
            console.log(`User ${user.id} already received reminder recently, skipping`);
            skipped++;
            continue;
          }

          // Create notification
          const title = '⏰ Lembrete de Inatividade';
          const body = `Não registas despesas há ${daysSinceLast} dias. Que tal atualizar as tuas finanças?`;

          console.log(`Sending inactivity reminder to user ${user.id}`);

          const { error: notifError } = await supabase.rpc('create_notification', {
            p_user_id: user.id,
            p_title: title,
            p_body: body,
            p_url: '/dashboard/transactions',
            p_type: 'inactivity_reminder',
          });

          if (notifError) {
            console.error(`Error creating notification for user ${user.id}:`, notifError);
            errors++;
          } else {
            console.log(`✅ Inactivity reminder sent to user ${user.id}`);
            sent++;

            // Mark reminder as sent
            await supabase.from('budget_alerts').upsert({
              user_id: user.id,
              category: 'system',
              threshold_percent: 0,
              alert_type: 'inactivity_reminder',
              last_sent: new Date().toISOString(),
              enabled: true,
            });
          }
        } else {
          console.log(`User ${user.id} active recently (${daysSinceLast} days), skipping`);
          skipped++;
        }

      } catch (userError: any) {
        console.error(`Error processing user ${user.id}:`, userError.message);
        errors++;
      }
    }

    console.log('=== INACTIVITY REMINDER COMPLETE ===');
    console.log(`Processed: ${processed}, Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        sent,
        skipped,
        errors,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending inactivity reminders:', error);
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
