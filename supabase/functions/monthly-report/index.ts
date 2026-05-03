import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MonthlyReport {
  total_income: number;
  total_expenses: number;
  balance: number;
  savings_rate: number;
  category_breakdown: Record<string, number>;
  transaction_count: number;
  top_transactions: Array<{ description: string; amount: number; category: string }>;
  previous_month: { balance: number; savings_rate: number };
  goals_progress: Array<{ name: string; current: number; target: number; percentage: number }>;
  period_start: string;
  period_end: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'FamFlow <onboarding@resend.dev>';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const today = new Date();
    const currentDay = today.getDate();

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users.users) {
      processed++;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, billing_cycle_day')
          .eq('id', user.id)
          .single();

        if (!profile) {
          skipped++;
          continue;
        }

        const billingDay = profile.billing_cycle_day || 1;
        
        // Send on billing day (end of cycle)
        if (currentDay !== billingDay) {
          skipped++;
          continue;
        }

        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('monthly_summary')
          .eq('user_id', user.id)
          .single();

        if (preferences && preferences.monthly_summary === false) {
          skipped++;
          continue;
        }

        const periodStart = calculatePeriodStart(today, billingDay);
        const periodEnd = calculatePeriodEnd(periodStart, billingDay);

        const { data: transactions } = await supabase
          .from('transactions_decrypted')
          .select('amount, type, category, description')
          .eq('user_id', user.id)
          .gte('date', periodStart)
          .lte('date', periodEnd);

        if (!transactions || transactions.length === 0) {
          skipped++;
          continue;
        }

        const report = calculateMonthlyReport(transactions, periodStart, periodEnd, billingDay);

        const { data: prevTransactions } = await supabase
          .from('transactions_decrypted')
          .select('amount, type')
          .eq('user_id', user.id)
          .gte('date', calculatePreviousPeriodStart(periodStart, billingDay))
          .lte('date', calculatePeriodEnd(calculatePreviousPeriodStart(periodStart, billingDay), billingDay));

        if (prevTransactions) {
          const prev = calculateBasicTotals(prevTransactions);
          report.previous_month = { balance: prev.balance, savings_rate: prev.savings_rate };
        }

        const { data: goals } = await supabase
          .from('goals')
          .select('name, current_amount, target_amount')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (goals && goals.length > 0) {
          report.goals_progress = goals.slice(0, 3).map(g => ({
            name: g.name,
            current: g.current_amount,
            target: g.target_amount,
            percentage: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)),
          }));
        }

        const userEmail = user.email;
        const firstName = profile?.full_name?.split(' ')[0] || 'Amigo';
        const emailHtml = generateEmailHtml(firstName, getMonthName(periodStart), report);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: userEmail,
            subject: `🎯 Poupaste ${formatCurrency(report.balance)} em ${getMonthName(periodStart)}!`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          sent++;
        } else {
          errors++;
        }

      } catch (e) {
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, sent, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculatePeriodStart(date: Date, billingDay: number): string {
  const result = new Date(date);
  result.setDate(billingDay);
  if (result >= date) result.setMonth(result.getMonth() - 1);
  return result.toISOString().split('T')[0];
}

function calculatePeriodEnd(periodStart: string, billingDay: number): string {
  const end = new Date(periodStart);
  end.setMonth(end.getMonth() + 1);
  end.setDate(billingDay);
  return end.toISOString().split('T')[0];
}

function calculatePreviousPeriodStart(currentPeriodStart: string, billingDay: number): string {
  const start = new Date(currentPeriodStart);
  start.setMonth(start.getMonth() - 1);
  return start.toISOString().split('T')[0];
}

function calculateMonthlyReport(transactions: any[], periodStart: string, periodEnd: string, billingDay: number): MonthlyReport {
  const totals = calculateBasicTotals(transactions);
  const category_breakdown: Record<string, number> = {};
  const topExpenses: Array<{ description: string; amount: number; category: string }> = [];
  
  for (const t of transactions) {
    if (t.type === 'expense') {
      category_breakdown[t.category] = (category_breakdown[t.category] || 0) + t.amount;
      if (topExpenses.length < 5) {
        topExpenses.push({ description: t.description, amount: t.amount, category: t.category });
        topExpenses.sort((a, b) => b.amount - a.amount);
        while (topExpenses.length > 5) topExpenses.pop();
      }
    }
  }

  return {
    total_income: totals.total_income,
    total_expenses: totals.total_expenses,
    balance: totals.balance,
    savings_rate: totals.savings_rate,
    category_breakdown,
    transaction_count: transactions.length,
    top_transactions: topExpenses,
    goals_progress: [],
    period_start: periodStart,
    period_end: periodEnd,
    previous_month: { balance: 0, savings_rate: 0 },
  };
}

function calculateBasicTotals(transactions: any[]): { total_income: number; total_expenses: number; balance: number; savings_rate: number } {
  let total_income = 0;
  let total_expenses = 0;
  for (const t of transactions) {
    const amount = parseFloat(t.amount) || 0;
    if (t.type === 'income') total_income += amount;
    else if (t.type === 'expense') total_expenses += amount;
  }
  const balance = total_income - total_expenses;
  const savings_rate = total_income > 0 ? (balance / total_income) * 100 : 0;
  return { total_income, total_expenses, balance, savings_rate };
}

function getMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(0)}€`.replace('.', ',');
}

function generateEmailHtml(name: string, monthName: string, report: MonthlyReport): string {
  const isPositive = report.balance >= 0;
  const savingsEmoji = report.savings_rate >= 20 ? '🎉' : '💪';
  const comparison = report.previous_month.balance !== 0 ? ((report.balance - report.previous_month.balance) / Math.abs(report.previous_month.balance) * 100) : 0;
  const comparisonText = report.previous_month.balance !== 0 ? `${comparison >= 0 ? '↑' : '↓'} ${Math.abs(comparison).toFixed(0)}% vs mês anterior` : '';

  const topCategories = Object.entries(report.category_breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([category, amount]) => `<tr><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;">${getCategoryEmoji(category)} ${category}</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(amount)}</td></tr>`).join('');

  const goalsHtml = report.goals_progress.length > 0 ? `<div style="background:linear-gradient(135deg,#10b981,#059669);padding:20px;border-radius:16px;margin:24px 0;"><p style="color:white;font-weight:600;margin:0 0 12px;">📌 PROGRESSO DAS METAS</p>${report.goals_progress.map(g => `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;color:white;font-size:13px;margin-bottom:4px;"><span>${g.name}</span><span>${g.percentage}%</span></div><div style="background:rgba(255,255,255,0.3);height:8px;border-radius:4px;"><div style="background:white;height:100%;width:${g.percentage}%;border-radius:4px;"></div></div></div>`).join('')}</div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;padding:32px 0;"><h1 style="margin:0;font-size:28px;color:#10b981;font-weight:800;">📊 FamFlow</h1></div><div style="background:white;border-radius:24px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);"><p style="color:#6b7280;font-size:16px;margin:0 0 8px;">Resumo de</p><h2 style="color:#1f2937;font-size:24px;margin:0 0 24px;font-weight:700;">${monthName}</h2><p style="color:#1f2937;font-size:16px;margin:0 0 4px;">Olá ${name}!</p><p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Aqui está o teu resumo financeiro! 💪</p><div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:20px;padding:24px;text-align:center;margin:0 0 24px;"><p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${savingsEmoji} ${isPositive ? 'POUPANÇA' : 'DÉFICE'}</p><p style="color:white;font-size:48px;font-weight:800;margin:0 0 8px;line-height:1;">${formatCurrency(report.balance)}</p><p style="color:rgba(255,255,255,0.9);font-size:18px;margin:0 0 12px;">${report.savings_rate.toFixed(0)}% da receita</p>${comparisonText ? `<p style="color:${comparison >= 0 ? '#a7f3d0' : '#fecaca'};font-size:14px;margin:0;font-weight:600;">${comparisonText}</p>` : ''}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 24px;"><div style="background:#f3f4f6;border-radius:12px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Receitas</p><p style="color:#10b981;font-size:20px;font-weight:700;margin:0;">${formatCurrency(report.total_income)}</p></div><div style="background:#f3f4f6;border-radius:12px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Despesas</p><p style="color:#ef4444;font-size:20px;font-weight:700;margin:0;">${formatCurrency(report.total_expenses)}</p></div></div><h3 style="color:#1f2937;font-size:16px;margin:0 0 12px;">🔥 Destaques</h3><table style="width:100%;border-collapse:collapse;margin:0 0 16px;">${topCategories}</table>${goalsHtml}<div style="text-align:center;margin:32px 0;"><a href="${Deno.env.get('APP_URL') || 'https://famflow.app'}/dashboard/reports" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">Ver Relatório Completo →</a></div></div><div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:12px;"><p style="margin:0 0 8px;">Enviado por FamFlow</p><p style="margin:0;"><a href="${Deno.env.get('APP_URL') || 'https://famflow.app'}" style="color:#10b981;text-decoration:none;">famflow.app</a></p></div></div></body></html>`;
}

function getCategoryEmoji(category: string): string {
  const m = {'Alimentação':'🍽️','Transportes':'🚗','Moradia':'🏠','Lazer':'🎮','Saúde':'💊','Educação':'📚','Restauração':'🍽️','Compras':'🛍️','Serviços':'💡','Outros':'📦'};
  return m[category] || '📊';
}