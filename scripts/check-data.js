import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqsjmavtkcrnorjemasq.supabase.co';
const supabaseKey = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Fornece a service role key como argumento ou define SUPABASE_SERVICE_ROLE_KEY');
  console.log('Uso: node check-data.js <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Verificando dados no Supabase...\n');

  const tables = [
    'transactions',
    'profiles',
    'goals',
    'budgets',
    'families',
    'notifications'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);

      if (error) {
        console.log(`❌ ${table}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || data?.length || 0} registos`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERRO - ${err.message}`);
    }
  }
}

checkData();