# Plano: Histórico Completo de Famílias

**Objetivo:** Utilizador **NUNCA perde dados** e pode ver **todo o histórico** de famílias por onde passou, mesmo estando sem família atualmente.

---

## **1️⃣ DATABASE CHANGES**

### **Migration 1: `family_history` table**

```sql
-- Tabela para guardar histórico de famílias
CREATE TABLE family_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  left_at TIMESTAMPTZ,
  role TEXT CHECK (role IN ('owner', 'partner', 'member', 'view_only')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_family_history_user ON family_history(user_id);
CREATE INDEX idx_family_history_family ON family_history(family_id);
CREATE INDEX idx_family_history_active ON family_history(user_id, left_at) WHERE left_at IS NULL;

-- RLS Policy
ALTER TABLE family_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family history" ON family_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert family history" ON family_history
  FOR INSERT WITH CHECK (true); -- API route handles auth

CREATE POLICY "System can update family history" ON family_history
  FOR UPDATE USING (true);
```

---

### **Migration 2: Update `family_members` (não apagar, apenas marcar inactive)**

```sql
-- Adicionar colunas de histórico
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

-- Modificar status para permitir re-ativar
ALTER TABLE family_members
  ALTER COLUMN status SET DEFAULT 'pending';

-- Índice para performance
CREATE INDEX idx_family_members_history ON family_members(user_id, family_id, status);
```

---

### **Migration 3: Update RLS policies (manter acesso histórico)**

```sql
-- Transactions: User's own + family's (current OR historical)
DROP POLICY IF EXISTS "Users can access transactions" ON transactions;
CREATE POLICY "Users can access transactions" ON transactions
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM family_history fh
      WHERE fh.family_id = transactions.family_id
      AND fh.user_id = auth.uid()
      AND fh.joined_at <= transactions.created_at
      AND (fh.left_at IS NULL OR fh.left_at >= transactions.created_at)
    )
  );

-- Goals: Same logic
DROP POLICY IF EXISTS "Users can access goals" ON goals;
CREATE POLICY "Users can access goals" ON goals
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM family_history fh
      WHERE fh.family_id = goals.family_id
      AND fh.user_id = auth.uid()
      AND fh.joined_at <= goals.created_at
      AND (fh.left_at IS NULL OR fh.left_at >= goals.created_at)
    )
  );

-- Budgets: Same logic
DROP POLICY IF EXISTS "Users can access budgets" ON budgets;
CREATE POLICY "Users can access budgets" ON budgets
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM family_history fh
      WHERE fh.family_id = budgets.family_id
      AND fh.user_id = auth.uid()
      AND fh.joined_at <= budgets.created_at
      AND (fh.left_at IS NULL OR fh.left_at >= budgets.created_at)
    )
  );
```

---

## **2️⃣ API CHANGES**

### **Ficheiro: `src/app/api/family/route.ts`**

#### **Ação `join` - Adicionar ao histórico:**

```typescript
// Após adicionar user à família:
await adminSupabase
  .from("family_history")
  .insert({
    user_id: user.id,
    family_id: targetFamily.id,
    role: newRole,
    joined_at: new Date().toISOString(),
  });
```

#### **Ação `leave` - Marcar saída no histórico:**

```typescript
// EM VEZ DE APAGAR family_members:

// 1. Atualizar family_history com data de saída
await adminSupabase
  .from("family_history")
  .update({ 
    left_at: new Date().toISOString()
  })
  .eq("user_id", user.id)
  .eq("family_id", profile.family_id)
  .is("left_at", null); // Apenas ativos

// 2. Marcar family_members como inactive (não apagar)
await adminSupabase
  .from("family_members")
  .update({ 
    status: "inactive",
    left_at: new Date().toISOString()
  })
  .eq("family_id", profile.family_id)
  .eq("user_id", user.id);

// 3. Remover associação atual (profiles)
await adminSupabase
  .from("profiles")
  .update({ family_id: null, role: null })
  .eq("id", user.id);
```

#### **Nova ação `getHistory` - Obter histórico:**

```typescript
else if (action === "getHistory") {
  const { data: history } = await adminSupabase
    .from("family_history")
    .select("*, families(name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return NextResponse.json({ history });
}
```

---

## **3️⃣ DATAPROVIDER CHANGES**

### **Ficheiro: `src/hooks/DataProvider.tsx`**

**Abordagem recomendada: Fetch em paralelo (mais simples)**

```typescript
// Fetch user's own data + current family + historical families
const [userTx, currentFamilyTx, historicalTx] = await Promise.all([
  supabase.from('transactions_decrypted').select('*').eq('user_id', user.id),
  
  familyId ? 
    supabase.from('transactions_decrypted').select('*').eq('family_id', familyId) : 
    Promise.resolve({ data: [] }),
  
  supabase
    .from('transactions_decrypted')
    .select('*, family_id')
    .in('family_id', history.map(h => h.family_id))
]);

// Filter historical by date range
const validHistorical = historicalTx.data?.filter(t => {
  const hist = history.find(h => h.family_id === t.family_id);
  if (!hist) return false;
  
  const txDate = new Date(t.created_at);
  const joined = new Date(hist.joined_at);
  const left = hist.left_at ? new Date(hist.left_at) : new Date();
  
  return txDate >= joined && txDate <= left;
}) || [];

// Combine all
const allTransactions = [
  ...userTx.data,
  ...currentFamilyTx.data,
  ...validHistorical
];
```

---

## **4️⃣ UI COMPONENTS**

### **Nova página: `src/app/dashboard/family/history/page.tsx`**

Ver histórico de famílias por onde passou.

---

## **5️⃣ MIGRATION ORDER**

1. Criar tabela `family_history` (Migration 1)
2. Adicionar colunas em `family_members` (Migration 2)
3. Atualizar RLS policies (Migration 3)
4. Atualizar API `family/route.ts` (join, leave, getHistory)
5. Atualizar DataProvider (fetch histórico)
6. Criar UI Family History (opcional)
7. Testes E2E

---

## **6️⃣ TESTES E2E**

### **Cenários:**

1. User cria família → entra noutra → sai → vê histórico
2. User em família cria transação → sai → transação continua visível
3. User sem família vê apenas dados pessoais
4. User re-entra na mesma família → 2 registos em family_history

---

## **7️⃣ ROLLBACK PLAN**

```sql
DROP TABLE IF EXISTS family_history CASCADE;

-- Reverter RLS policies
DROP POLICY IF EXISTS "Users can access transactions" ON transactions;
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (user_id = auth.uid());
```

---

## **8️⃣ TIMELINE**

| Tarefa | Tempo |
|--------|-------|
| Migrations (1,2,3) | 1h 30 min |
| API changes | 1h |
| DataProvider update | 1h 30 min |
| UI Family History | 2h |
| Testes E2E | 2h |
| **TOTAL** | **~8 horas** |

---

**Criado:** 8 Maio 2026  
**Status:** Pronto para implementação
