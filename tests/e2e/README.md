# 🧪 Guia de Testes E2E - FamFlow

Este guia explica como configurar e executar os testes E2E com autenticação automática.

---

## 📋 Pré-requisitos

1. **Ter uma instância Supabase** (desenvolvimento ou staging)
2. **Acesso ao SQL Editor** do Supabase
3. **Node.js 20+** instalado

---

## 🚀 Configuração Inicial

### Passo 1: Criar Utilizador de Teste

**Opção A: Manual (Recomendado)**

1. Vai para a tua app em desenvolvimento: `http://localhost:3000`
2. Cria uma conta com:
   - Email: `test@famflow.app`
   - Password: `Test1234!`
3. Confirma o email (se necessário)

**Opção B: Via Supabase Dashboard**

1. Vai para Supabase Dashboard → Authentication → Users
2. Clica em "Add user" → "Create new user"
3 - Email: `test@famflow.app`
   - Password: `Test1234!`
   - Auto Confirm User: ✅

---

### Passo 2: Executar Seed Data

1. Abre o **SQL Editor** no Supabase
2. Copia o conteúdo de `tests/e2e/seed-data.sql`
3. Cola no SQL Editor e executa
4. Verifica que foram criadas:
   - ✅ 8 transações
   - ✅ 3 metas
   - ✅ 5 orçamentos
   - ✅ 3 notificações

---

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar ficheiro de exemplo
cp .env.test.example .env.local
```

Editar `.env.local`:

```bash
# Test Credentials
TEST_EMAIL=test@famflow.app
TEST_PASSWORD=Test1234!

# Supabase (opcional, para seed automático)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## ▶️ Executar Testes

### Local

```bash
# Todos os testes E2E
npm run test:e2e

# Com UI interativo
npm run test:e2e:ui

# Em modo debug (abre browser)
npm run test:e2e:debug

# Testes específicos
npm run test:e2e -- --grep "cria nova meta"

# Apenas accessibility
npm run test:a11y
```

### GitHub Actions

Os testes rodam automaticamente em:
- ✅ Push para `main` ou `develop`
- ✅ Pull requests para `main` ou `develop`

---

## 🔐 Configurar GitHub Secrets

Para os testes E2E no GitHub Actions:

1. Vai para o teu repositório no GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Adiciona os seguintes secrets:

| Nome | Valor |
|------|-------|
| `TEST_EMAIL` | `test@famflow.app` |
| `TEST_PASSWORD` | `Test1234!` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

---

## 📊 Estrutura dos Testes

```
tests/e2e/
├── fixtures.ts              # Setup de autenticação automática
├── seed-data.sql            # Dados de teste para Supabase
├── auth.spec.ts             # Login, logout (4 testes)
├── public-pages.spec.ts     # Redirecionamentos (8 testes)
├── dashboard.spec.ts        # Dashboard, navegação (7 testes)
├── transactions.spec.ts     # CRUD transações (11 testes)
├── goals.spec.ts            # CRUD metas (11 testes)
├── budgets.spec.ts          # CRUD orçamentos (11 testes)
├── analytics.spec.ts        # Gráficos, filtros (10 testes)
├── settings.spec.ts         # Perfil, preferências (10 testes)
└── notifications.spec.ts    # Notificações in-app (11 testes)
```

**Total:** 73 testes × 2 browsers (Desktop + Mobile) = **146 execuções**

---

## 🛠️ Debugging

### Testes falham localmente

1. **Verifica se estás autenticado:**
   ```bash
   # Abre o browser e faz login manual
   npm run test:e2e:debug
   ```

2. **Verifica seed data:**
   ```sql
   SELECT COUNT(*) FROM transactions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@famflow.app');
   ```

3. **Limpa estado:**
   ```bash
   # Limpa cache do Playwright
   npx playwright test --clear-cache
   ```

### Testes falham no GitHub Actions

1. **Verifica secrets:**
   - Settings → Secrets → Actions
   - Confirma que todos os 4 secrets estão definidos

2. **Download artifacts:**
   - Vai para a run do GitHub Actions
   - Download "playwright-report" e abre `index.html`

3. **Verbose logging:**
   ```yaml
   - name: Run E2E tests
     run: npm run test:e2e -- --reporter=line
   ```

---

## 📝 Adicionar Novos Testes

### Template de teste com autenticação

```typescript
import { test, expect } from './fixtures';

test.describe('Feature X', () => {
  test('faz algo', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/feature');
    
    // O authenticatedPage já está logado automaticamente
    await expect(authenticatedPage.locator('text=Feature')).toBeVisible();
  });
});
```

### Dicas

1. **Usa `authenticatedPage`** em vez de `page` para testes que requerem login
2. **Para testes públicos**, usa `page` normal (ex: login, signup)
3. **Espera por elementos** com `waitForTimeout` ou `waitForSelector`
4. **Screenshots automáticos** em falha (já configurado)

---

## 🎯 Coverage Goals

| Categoria | Target | Atual |
|-----------|--------|-------|
| E2E Tests | 50+ | 73 ✅ |
| Unit Tests | 20+ | 21 ✅ |
| Accessibility | 0 violations | ✅ |
| Browsers | Desktop + Mobile | ✅ |

---

## 🔄 CI/CD Pipeline

```yaml
Push/PR → GitHub Actions
  ├─ Install dependencies
  ├─ Build Next.js
  ├─ Run E2E tests (Chromium + Mobile)
  ├─ Upload report
  └─ Comment PR with results
```

---

## 📞 Troubleshooting

### "Test timeout exceeded"

- Aumenta timeout em `playwright.config.ts`
- Verifica se o servidor está a correr
- Usa `force: true` em clicks problemáticos

### "Element not found"

- Verifica se o seed data foi executado
- Confirma que o utilizador de teste existe
- Usa selectors mais específicos

### "Authentication failed"

- Verifica credenciais em `.env.local`
- Confirma que o utilizador está confirmado no Supabase
- Limpa cookies/cache do browser

---

**Última atualização:** 25 de Abril de 2026
