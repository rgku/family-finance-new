import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.CRON_SECRET) {
  console.error('CRITICAL: CRON_SECRET not configured — cron endpoints blocked');
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('=== PROCESS RECURRING START ===');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date().toISOString().split('T')[0];
    console.log('Processing recurring transactions for date:', today);

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
        console.log('Sending notification for manual creation...');
        
        try {
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
        errors++;
      } else {
        console.log(`Next run updated to: ${nextRun}`);
      }
    }

    console.log('=== PROCESS RECURRING COMPLETE ===');
    console.log(`Processed: ${processed}, Created: ${created}, Notified: ${notified}, Errors: ${errors}`);

    return NextResponse.json({ 
      success: true,
      processed,
      created,
      notified,
      errors,
    });
  } catch (error: any) {
    console.error('Error processing recurring transactions:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

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

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger recurring processing' });
}
