const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email.includes('bernardo'));
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  
  const { data: trans } = await supabase
    .from('transactions')
    .select('id, user_id, plain_description')
    .eq('user_id', user.id);
  console.log('\nTransactions for user:', trans?.length || 0);
  console.log(JSON.stringify(trans, null, 2));
}

checkUserData();