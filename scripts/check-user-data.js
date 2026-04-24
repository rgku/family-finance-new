import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqsjmavtkcrnorjemasq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxc2ptYXZ0a2Nybm9yamVtYXNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA3NzkxMSwiZXhwIjoyMDkxNjUzOTExfQ.Ilu9tGcLEqWN3iffiWiuQg5-soAlvLH-jbHrTqqyLLU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUserData() {
  console.log('🔍 Verificando dados do utilizador...\n');

  // Verificar profiles
  console.log('=== PROFILES ===');
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(profiles);

  // Verificar transactions com user_id específico
  console.log('\n=== TRANSACTIONS ===');
  const { data: transactions } = await supabase.from('transactions').select('*');
  console.log(`${transactions.length} transactions`);
  
  // Verificar unique user_ids
  const userIds = [...new Set(transactions.map(t => t.user_id))];
  console.log('User IDs nas transactions:', userIds);

  // Verificar goals
  console.log('\n=== GOALS ===');
  const { data: goals } = await supabase.from('goals').select('*');
  console.log(`${goals.length} goals`);
  const goalUserIds = [...new Set(goals.map(g => g.user_id))];
  console.log('User IDs nos goals:', goalUserIds);

  // Verificar budgets
  console.log('\n=== BUDGETS ===');
  const { data: budgets } = await supabase.from('budgets').select('*');
  console.log(`${budgets.length} budgets`);
  const budgetUserIds = [...new Set(budgets.map(b => b.user_id))];
  console.log('User IDs nos budgets:', budgetUserIds);

  console.log('\n=== CONCLUSÃO ===');
  console.log('Para a aplicação mostrar dados, o user_id do utilizador logado');
  console.log('deve corresponder a um dos user_ids listados acima.');
}

checkUserData();