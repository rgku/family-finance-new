import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

if (!process.env.CRON_SECRET) {
  console.error('CRITICAL: CRON_SECRET not configured — cron endpoints blocked');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('=== MONTHLY REPORT EMAIL START ===');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get all active profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, billing_cycle_day');

    if (!profiles) {
      return NextResponse.json({ success: false, error: 'No users found' });
    }

    // Get emails from auth.users (accessible via service_role key)
    const { data: authData } = await supabase.auth.admin.listUsers();
    const emailMap = new Map<string, string>();
    for (const u of authData?.users || []) {
      emailMap.set(u.id, u.email || '');
    }

    // Merge profile data with email
    const users = profiles.map(p => ({
      ...p,
      email: emailMap.get(p.id) || '',
    }));

    let emailsSent = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (!user.email) {
          console.warn(`⏭️ Skipping user ${user.id} - no email found`);
          continue;
        }
        const billingDay = user.billing_cycle_day || 1;
        const today = new Date();
        const currentDay = today.getDate();
        
        // Only send email if today is the user's billing cycle day
        if (currentDay !== billingDay) {
          console.log(`⏭️ Skipping user ${user.id} - billing cycle day is ${billingDay}, today is ${currentDay}`);
          continue;
        }
        
        // Calculate period: from billing_day of previous month to yesterday
        const periodEnd = new Date(today);
        periodEnd.setDate(periodEnd.getDate() - 1);
        
        const periodStart = new Date(today);
        periodStart.setMonth(periodStart.getMonth() - 1);
        // Keep the billing day
        if (periodStart.getDate() !== billingDay) {
          periodStart.setDate(billingDay);
        }
        
        // Format dates for query
        const startDate = periodStart.toISOString().split('T')[0];
        const endDate = periodEnd.toISOString().split('T')[0];

        // Get transactions for the period
        const { data: transactions } = await supabase
          .from('transactions_decrypted')
          .select('amount, type, category, date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lt('date', endDate);

        if (!transactions || transactions.length === 0) {
          console.log(`⏭️ Skipping user ${user.id} - no transactions`);
          continue;
        }

        // Calculate totals
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        // Category breakdown
        const categoryMap = new Map<string, number>();
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + Number(t.amount));
          });

        const topCategories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Format period for email
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const periodName = `${monthNames[periodStart.getMonth()]} - ${monthNames[periodEnd.getMonth()]}`;
        const year = periodEnd.getFullYear();

        // Generate HTML email
        const html = `
<div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:32px 0">
      <h1 style="margin:0;font-size:28px;color:#10b981;font-weight:800">📊 FamFlow</h1>
    </div>
    <div style="background:white;border-radius:24px;padding:32px">
      <p style="color:#6b7280;font-size:16px;margin:0 0 8px">Resumo de</p>
      <h2 style="color:#1f2937;font-size:24px;margin:0 0 24px;font-weight:700">${periodName} ${year}</h2>
      <p style="color:#1f2937;font-size:16px;margin:0 0 4px">Olá ${escapeHtml(user.full_name || 'Utilizador')}!</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Aqui está o teu resumo financeiro! 💪</p>
      
      <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:20px;padding:24px;text-align:center;margin:0 0 24px">
        <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">🎉 POUPANÇA</p>
        <p style="color:white;font-size:48px;font-weight:800;margin:0 0 8px;line-height:1">${savings.toFixed(0)}€</p>
        <p style="color:rgba(255,255,255,0.9);font-size:18px;margin:0">${savingsRate >= 0 ? '+' : ''}${savingsRate.toFixed(0)}% da receita</p>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 24px">
        <div style="background:#f3f4f6;border-radius:12px;padding:16px">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Receitas</p>
          <p style="color:#10b981;font-size:20px;font-weight:700;margin:0">${income.toFixed(0)}€</p>
        </div>
        <div style="background:#f3f4f6;border-radius:12px;padding:16px">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Despesas</p>
          <p style="color:#ef4444;font-size:20px;font-weight:700;margin:0">${expenses.toFixed(0)}€</p>
        </div>
      </div>
      
      ${topCategories.length > 0 ? `
      <h3 style="color:#1f2937;font-size:16px;margin:0 0 12px">🔥 Destaques</h3>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
        <tbody>
          ${topCategories.map(([cat, amount]) => `
          <tr>
            <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb">${escapeHtml(cat)}</td>
            <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${amount.toFixed(0)}€</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      <div style="text-align:center;margin:32px 0">
        <a href="https://famflow.app/dashboard/reports" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Ver Relatório Completo →</a>
      </div>
    </div>
    <div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:12px">
      <p style="margin:0 0 8px">Enviado por FamFlow</p>
      <p style="margin:0"><a href="https://famflow.app" style="color:#10b981;text-decoration:none">famflow.app</a></p>
    </div>
  </div>
</div>
        `;

        // Send email
        const { data, error } = await resend.emails.send({
          from: 'FamFlow <onboarding@resend.dev>',
          to: [user.email],
          subject: `📊 O teu resumo de ${periodName} ${year}`,
          html,
        });

        if (error) {
          console.error(`❌ Email failed for user ${user.id}:`, error);
          errors++;
        } else {
          console.log(`✅ Email sent to user ${user.id}: ${data?.id}`);
          emailsSent++;
        }
      } catch (userError: any) {
        console.error(`❌ Error processing user ${user.id}:`, userError);
        errors++;
      }
    }

    console.log('=== MONTHLY REPORT EMAIL COMPLETE ===');
    console.log(`Emails sent: ${emailsSent}, Errors: ${errors}`);

    return NextResponse.json({ 
      success: true,
      emailsSent,
      errors,
    });
  } catch (error: any) {
    console.error('Error sending monthly reports:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger monthly report emails' });
}
