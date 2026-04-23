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
    console.log('=== PROCESS RECURRING START ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    console.log('Processing recurring transactions for date:', today);

    // Get active recurring transactions due today or earlier
    const { data: recurring, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('enabled', true)
      .lte('next_run', today);

    if (fetchError) {
      throw fetchError;
    }

    console.log('Found', recurring?.length || 0, 'recurring transactions to process');

    let processed = 0;
    let created = 0;
    let notified = 0;
    let errors = 0;

    for (const rec of recurring!) {
      processed++;
      console.log(`Processing recurring #${rec.id}: ${rec.description} (${rec.amount}€)`);

      if (rec.auto_create) {
        // Create transaction automatically
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: rec.user_id,
            description: rec.description,
            amount: rec.amount,
            type: rec.type,
            category: rec.category,
            date: today,
          });

        if (insertError) {
          console.error('Error creating transaction:', insertError);
          errors++;
          continue;
        }

        created++;
        console.log('✅ Transaction created automatically');
      } else {
        // Send notification for user to create manually
        console.log('Sending notification for manual creation...');
        
        try {
          // Create in-app notification directly via RPC
          const { data: notifId, error: notifError } = await supabase.rpc('create_notification', {
            p_user_id: rec.user_id,
            p_title: 'Despesa recorrente pendente',
            p_body: `Tens uma despesa recorrente de "${rec.description}" (${rec.amount}€) para registrar hoje.`,
            p_url: '/dashboard/transaction/new',
            p_type: 'recurring_reminder',
          });

          if (notifError) {
            console.error('Error creating notification:', notifError);
            errors++;
          } else {
            console.log('✅ In-app notification created:', notifId);
            notified++;
          }
        } catch (rpcError: any) {
          console.error('RPC error creating notification:', rpcError.message);
          errors++;
        }
      }

      // Calculate and update next_run date
      const nextRun = calculateNextRun(rec.frequency, rec.day_of_month);
      
      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({ 
          last_created: today,
          next_run: nextRun,
        })
        .eq('id', rec.id);

      if (updateError) {
        console.error('Error updating next_run:', updateError);
      } else {
        console.log(`Next run updated to: ${nextRun}`);
      }
    }

    console.log('=== PROCESS RECURRING COMPLETE ===');
    console.log(`Processed: ${processed}, Created: ${created}, Notified: ${notified}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        created,
        notified,
        errors,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error processing recurring transactions:', error);
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

function calculateNextRun(frequency: string, dayOfMonth?: number): string {
  const date = new Date();
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      if (dayOfMonth) {
        // Handle end of month edge cases
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, daysInMonth));
      }
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      if (dayOfMonth) {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, daysInMonth));
      }
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      if (dayOfMonth) {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, daysInMonth));
      }
      break;
  }
  
  return date.toISOString().split('T')[0];
}
