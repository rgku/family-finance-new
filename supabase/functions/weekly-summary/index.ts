import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WeeklySummary {
  user_id: string;
  total_spent: number;
  total_income: number;
  category_breakdown: Record<string, number>;
  transaction_count: number;
  week_start: string;
  week_end: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== WEEKLY SUMMARY START ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calculate week dates (previous week: Monday to Sunday)
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - 1); // Yesterday (end of last week)
    
    // Find last Monday (start of last week)
    const weekStart = new Date(weekEnd);
    const dayOfWeek = weekEnd.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStart.setDate(weekEnd.getDate() - ((dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 6)); // Go back to Monday of last week
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    console.log(`Calculating weekly summary from ${weekStartStr} to ${weekEndStr}`);

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
        // Check if user has weekly_summary enabled
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('weekly_summary')
          .eq('user_id', user.id)
          .single();

        // Skip if user disabled weekly summary
        if (preferences && preferences.weekly_summary === false) {
          console.log(`User ${user.id} disabled weekly summary, skipping`);
          skipped++;
          continue;
        }

        // Get transactions for last week
        const { data: transactions, error: transError } = await supabase
          .from('transactions_decrypted')
          .select('amount, type, category')
          .eq('user_id', user.id)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr);

        if (transError) {
          console.error(`Error fetching transactions for user ${user.id}:`, transError);
          errors++;
          continue;
        }

        if (!transactions || transactions.length === 0) {
          console.log(`No transactions for user ${user.id} this week, skipping`);
          skipped++;
          continue;
        }

        // Calculate summary
        const summary = calculateWeeklySummary(transactions, weekStartStr, weekEndStr);

        // Generate summary message
        const title = '📊 Resumo Semanal';
        const body = generateSummaryBody(summary);

        console.log(`Sending weekly summary to user ${user.id}: ${summary.total_spent.toFixed(2)}€ spent`);

        // Create notification
        const { error: notifError } = await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_title: title,
          p_body: body,
          p_url: '/dashboard/analytics',
          p_type: 'weekly_summary',
        });

        if (notifError) {
          console.error(`Error creating notification for user ${user.id}:`, notifError);
          errors++;
        } else {
          console.log(`✅ Weekly summary sent to user ${user.id}`);
          sent++;
        }

      } catch (userError: any) {
        console.error(`Error processing user ${user.id}:`, userError.message);
        errors++;
      }
    }

    console.log('=== WEEKLY SUMMARY COMPLETE ===');
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
    console.error('Error generating weekly summaries:', error);
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

function calculateWeeklySummary(
  transactions: any[],
  weekStart: string,
  weekEnd: string
): WeeklySummary {
  let total_spent = 0;
  let total_income = 0;
  const category_breakdown: Record<string, number> = {};
  let transaction_count = 0;

  for (const t of transactions) {
    const amount = parseFloat(t.amount) || 0;
    transaction_count++;

    if (t.type === 'expense') {
      total_spent += amount;
      category_breakdown[t.category] = (category_breakdown[t.category] || 0) + amount;
    } else if (t.type === 'income') {
      total_income += amount;
    }
  }

  return {
    user_id: '',
    total_spent,
    total_income,
    category_breakdown,
    transaction_count,
    week_start: weekStart,
    week_end: weekEnd,
  };
}

function generateSummaryBody(summary: WeeklySummary): string {
  const lines: string[] = [];
  
  // Basic summary
  lines.push(`Esta semana fizeste ${summary.transaction_count} transações.`);
  lines.push(`💸 Gastaste ${summary.total_spent.toFixed(2)}€`);
  
  if (summary.total_income > 0) {
    lines.push(`💰 Recebeste ${summary.total_income.toFixed(2)}€`);
  }

  // Top categories (top 3)
  const sortedCategories = Object.entries(summary.category_breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (sortedCategories.length > 0) {
    lines.push('');
    lines.push('Principais categorias:');
    for (const [category, amount] of sortedCategories) {
      lines.push(`  • ${category}: ${amount.toFixed(2)}€`);
    }
  }

  return lines.join('\n');
}
