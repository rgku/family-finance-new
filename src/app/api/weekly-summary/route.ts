import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('=== WEEKLY SUMMARY START ===');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name');

    if (!users) {
      return NextResponse.json({ success: false, error: 'No users found' });
    }

    let summariesSent = 0;

    for (const user of users) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', lastWeek.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (!transactions || transactions.length === 0) continue;

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = totalIncome - totalExpenses;

      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: 'Resumo Semanal',
        p_body: `Esta semana: ${totalIncome.toFixed(2)}€ receita, ${totalExpenses.toFixed(2)}€ despesa. Saldo: ${balance.toFixed(2)}€`,
        p_url: '/dashboard/analytics',
        p_type: 'weekly_summary',
      });

      if (!notifError) {
        summariesSent++;
        console.log(`✅ Weekly summary sent to user ${user.id}`);
      }
    }

    console.log('=== WEEKLY SUMMARY COMPLETE ===');
    console.log(`Summaries sent: ${summariesSent}`);

    return NextResponse.json({ 
      success: true,
      summariesSent,
    });
  } catch (error: any) {
    console.error('Error sending weekly summaries:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger weekly summary' });
}
