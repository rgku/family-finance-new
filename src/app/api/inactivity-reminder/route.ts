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
    console.log('=== INACTIVITY REMINDER START ===');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    if (!users) {
      return NextResponse.json({ success: false, error: 'No users found' });
    }

    let remindersSent = 0;

    for (const user of users) {
      const { data: lastTransaction } = await supabase
        .from('transactions_decrypted')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastTransaction) continue;

      const lastTransactionDate = new Date(lastTransaction.date);
      
      if (lastTransactionDate < threeDaysAgo) {
        const { error: notifError } = await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_title: 'Vamos registrar transações?',
          p_body: `Já não registras transações há 3 dias. Mantém tuas finanças atualizadas!`,
          p_url: '/dashboard/transaction/new',
          p_type: 'inactivity_reminder',
        });

        if (!notifError) {
          remindersSent++;
          console.log(`✅ Inactivity reminder sent to user ${user.id}`);
        }
      }
    }

    console.log('=== INACTIVITY REMINDER COMPLETE ===');
    console.log(`Reminders sent: ${remindersSent}`);

    return NextResponse.json({ 
      success: true,
      remindersSent,
    });
  } catch (error: any) {
    console.error('Error sending inactivity reminders:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger inactivity reminder' });
}
