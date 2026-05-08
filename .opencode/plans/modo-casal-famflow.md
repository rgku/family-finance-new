# 📋 Plano de Implementação: Modo Casal FamFlow

**Documento criado:** 8 de Maio de 2026  
**Última atualização:** 8 de Maio de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para implementação

---

## 🎯 Visão Geral

**Objetivo:** Adicionar camada opcional "Modo Casal" dentro do conceito Família existente, permitindo divisão de despesas entre 2 membros com acerto mensal via MB WAY.

**Princípio fundamental:** **Não substituir Família por Casal.** Manter conceito Família como guarda-chuva e adicionar camada Casal por cima, ativável apenas quando 2 adultos querem regras de divisão entre si.

---

## ✅ Validação de Bugs Reportados

**Investigação concluída em:** 8 de Maio de 2026

| Bug Reportado | Estado Real | Ação Necessária |
|---------------|-------------|-----------------|
| **Código convite "null"** | ⚠️ Edge case raro | Logging defensivo (opcional) |
| **Metas duplicadas** | ✅ Já resolvido | Nenhuma |
| **Dashboard "saldo 0"** | ✅ Comportamento esperado | Nenhuma |

**Conclusão:** **Nenhum bug é crítico.** Modo Casal pode avançar imediatamente sem blockers.

---

## 🏗️ Arquitetura Técnica

### **Filosofia: Zero Impacto em Produção**

- **100% tabelas NOVAS** - zero alterações em tabelas existentes
- **FKs apenas referenciam** - não modificam tabelas antigas
- **Código condicional** - funcionalidade só ativa se casal existir
- **Rollback trivial** - DROP das 6 tabelas novas

### **Tabelas Existentes (INTOCÁVEIS)**

```
✅ families
✅ profiles
✅ transactions / transactions_decrypted
✅ budgets
✅ goals
✅ members
✅ notification_preferences
```

### **Tabelas Novas (6)**

```
1. couple_relations (nova)
2. couple_settings (nova)
3. category_rules (nova)
4. transaction_splits (nova)
5. settlement_periods (nova)
6. settlement_payments (nova)
```

---

## 📅 Timeline: 3 Semanas + Buffer

### **Semana 1 — Foundation do Modo Casal** (5 dias)

#### **1.1 Modelo de Dados** (2 dias)

**Migrações SQL (todas CREATE, zero ALTER):**

```sql
-- 1. couple_relations
CREATE TABLE couple_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_a UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- 2. couple_settings
CREATE TABLE couple_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_relations(id) ON DELETE CASCADE UNIQUE,
  mode TEXT NOT NULL DEFAULT 'pool',
  income_a DECIMAL(12,2) DEFAULT 0,
  income_b DECIMAL(12,2) DEFAULT 0,
  default_payer UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. category_rules
CREATE TABLE category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_relations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  responsible_user UUID REFERENCES users(id),
  split_a_percent DECIMAL(5,2) DEFAULT 50.00,
  split_b_percent DECIMAL(5,2) DEFAULT 50.00,
  fallback_mode TEXT DEFAULT '5050',
  UNIQUE(couple_id, category)
);

-- 4. transaction_splits
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES users(id),
  share_a DECIMAL(12,2) NOT NULL,
  share_b DECIMAL(12,2) NOT NULL,
  is_personal BOOLEAN DEFAULT false,
  split_mode_at_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. settlement_periods
CREATE TABLE settlement_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couple_relations(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_shared_expenses DECIMAL(12,2) NOT NULL,
  paid_by_a DECIMAL(12,2) DEFAULT 0,
  paid_by_b DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  owes_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_id, month, year)
);

-- 6. settlement_payments
CREATE TABLE settlement_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES settlement_periods(id) ON DELETE CASCADE UNIQUE,
  method TEXT NOT NULL,
  mbway_phone_a TEXT,
  mbway_phone_b TEXT,
  confirmed_by_a BOOLEAN DEFAULT false,
  confirmed_by_b BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices de Performance:**

```sql
CREATE INDEX idx_couple_relations_family ON couple_relations(family_id);
CREATE INDEX idx_couple_relations_active ON couple_relations(active) WHERE active = true;
CREATE INDEX idx_transaction_splits_transaction ON transaction_splits(transaction_id);
CREATE INDEX idx_settlement_periods_couple ON settlement_periods(couple_id, year, month);
CREATE INDEX idx_settlement_periods_status ON settlement_periods(status);
```

---

#### **1.2 API Routes** (1.5 dias)

**Novas rotas:**

```
POST   /api/couple/activate           - Ativar modo casal
GET    /api/couple/settings           - Ler configurações
PUT    /api/couple/settings           - Atualizar configurações
GET    /api/couple/split-preview      - Preview de divisão
POST   /api/couple/settlement/close   - Fechar período (cron)
GET    /api/couple/settlement/current - Período atual
POST   /api/couple/settlement/confirm - Confirmar pagamento
```

---

#### **1.3 UI - Separador Casal** (1.5 dias)

**Páginas novas:**

```
src/app/dashboard/family/couple/
├── page.tsx              - Página principal
├── activate/page.tsx     - Fluxo de ativação
├── settings/page.tsx     - Configurações
└── settlement/page.tsx   - Ecrã de acerto
```

---

### **Semana 2 — Engine de Divisão** (5 dias)

#### **2.1 Form de Transação** (2 dias)

**Componentes:**

```
src/components/transaction/
├── SplitSelector.tsx      - Radio: Regra | Pessoal | Custom
├── SplitPreview.tsx       - "22,50€ cada (50/50)"
├── CustomSplitInputs.tsx  - Inputs manuais %
└── PersonalToggle.tsx     - "100% pessoal"
```

---

#### **2.2 Algoritmos de Split** (2 dias)

**Ficheiro:** `src/lib/couple/splitCalculator.ts`

**Modos:**
- **50/50:** `amount / 2`
- **Proporcional:** `(income_a / total_income) * amount`
- **Categorias:** Lookup `category_rules` + fallback 50/50
- **Personalizado:** Valores manuais

---

#### **2.3 UI de Visualização** (1 dia)

**Lista transações:** Coluna "Divisão" com ícones 👤/👥

---

### **Semana 3 — Acerto Mensal MB WAY** (5 dias)

#### **3.1 Cron de Fecho** (1 dia)

**API:** `/api/couple/settlement/close`  
**Schedule:** `0 9 1 * *` (dia 1, 09:00 UTC)

---

#### **3.2 Dashboard Card** (1.5 dias)

**Componente:** `SettlementCard.tsx`

**Condicional:** Só mostra se `mode !== 'pool'` e período pendente

---

#### **3.3 Ecrã de Acerto** (2 dias)

**Métodos:**
- 💳 MB WAY deeplink: `mbway://payment?phone=...&amount=...`
- 📱 QR Code (fallback)
- 🏦 Copiar IBAN (one-tap)
- ✅ Marcar pago (manual)

---

#### **3.4 Notificações** (1 dia)

- **Push:** OneSignal (dia 1)
- **Email:** Resend (dia 1)

---

## ✅ Critérios de Done

### **Testes End-to-End (7 cenários)**

1. ✅ Pool Comum - zero cálculos
2. ✅ 50/50 - divide a metade
3. ✅ Proporcional 70/30 - % correta
4. ✅ Categorias - aplica regras
5. ✅ Mudança de modo - só futuro
6. ✅ Acerto MB WAY - valor correto
7. ✅ Períodos múltiplos - histórico

### **Beta Testers**

- 5 casais reais (1 semana)
- Feedback loop: Telegram/WhatsApp

---

## 🚀 Deploy

### **Segurança**

- **100% seguro:** Tabelas só novas
- **Zero downtime:** App continua funcional
- **Rollback fácil:** DROP 6 tabelas

### **Ordem**

```sql
-- 1. Criar tabelas
-- 2. Criar índices
-- 3. Criar RLS policies
-- 4. Deploy código
```

---

## 🛡️ Riscos

| Risco | Mitigação |
|-------|-----------|
| Complexidade splits | Começar 50/50 + Proporcional |
| MB WAY falha | QR + IBAN fallback |
| Confusão UI | Copy clara + defaults |

---

## 📊 Timeline

| Semana | Entregas | Dias |
|--------|----------|------|
| 1 | DB + UI Casal | 5 |
| 2 | Splits + Algoritmos | 5 |
| 3 | Acerto + MB WAY | 5 |
| Buffer | Fixes | 3 |

**Total:** 18 dias úteis

---

## 📚 Referências

- Plano original: `docs/famflow-plano-casais.md`
- Validação bugs: Secção 2 deste documento

---

**Próximo passo:** Avançar Semana 1 (criar migrations SQL)
