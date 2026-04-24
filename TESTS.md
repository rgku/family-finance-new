# Testes - FamFlow

Este documento descreve como executar os testes no FamFlow.

## 📋 Tipos de Testes

### 1. Testes Unitários (Jest)

Testes para hooks e funções utilitárias.

**Comandos:**
```bash
# Executar todos os testes unitários
npm test

# Executar com coverage
npm run test:coverage

# Executar testes específicos
npm test -- --testPathPattern=useSpendingPower
```

**Localização:** `src/hooks/__tests__/`

**Hooks testados:**
- `useSpendingPower` - 7 testes
- `useSubscriptionTracker` - 7 testes
- `useFiscalSnapshot` - 7 testes
- Total: 21 testes

**Coverage threshold:** 70% (mínimo)

---

### 2. Testes E2E (Playwright)

Testes end-to-end que simulam utilizadores reais.

**Comandos:**
```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com UI
npm run test:e2e:ui

# Executar em modo debug
npm run test:e2e:debug

# Executar apenas testes de accessibility
npm run test:a11y
```

**Localização:** `tests/e2e/`

**Páginas testadas:**
- `auth.spec.ts` - Autenticação (4 testes)
- `dashboard.spec.ts` - Dashboard (4 testes)
- `analytics.spec.ts` - Analytics (8 testes)
- `budgets.spec.ts` - Orçamentos (6 testes)
- `goals.spec.ts` - Objetivos (7 testes)
- `transactions.spec.ts` - Transações (7 testes)
- `settings.spec.ts` - Definições (6 testes)
- `notifications.spec.ts` - Notificações (3 testes)
- Total: ~45 testes

**Browser:** Chrome (Desktop + Mobile)

---

### 3. Testes de Accessibility (axe-core)

Auditoria automática de accessibility WCAG AA.

**Comando:**
```bash
npm run test:a11y
```

**Localização:** `tests/accessibility/audit.spec.ts`

**Páginas auditadas:**
- Home (/)
- Dashboard (/dashboard)
- Analytics (/dashboard/analytics)
- Budgets (/dashboard/budgets)
- Goals (/dashboard/goals)
- Transactions (/dashboard/transactions)
- Settings (/dashboard/settings)

**Critério:** Zero violações críticas ou graves

---

## 🔄 CI/CD Integration

### GitHub Actions

Dois workflows automáticos:

#### 1. CI (`ci.yml`)
Executa em:
- Push para `main` ou `develop`
- Pull requests para `main`

Passos:
1. Install dependencies
2. Run lint
3. Run unit tests
4. Build application
5. Upload coverage report

#### 2. E2E Tests (`e2e.yml`)
Executa em:
- Push para `main` ou `develop`
- Pull requests para `main`

Passos:
1. Install dependencies
2. Install Playwright browsers
3. Build application
4. Run E2E tests
5. Upload test results
6. Upload screenshots (se falhar)

---

## 📊 Coverage Report

Para gerar relatório de coverage:

```bash
npm run test:coverage
```

O relatório é gerado em:
- `coverage/lcov.info` (para CI)
- `coverage/index.html` (para visualizar no browser)

**Thresholds mínimos:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## 🐛 Debugging

### Testes Unitários

```bash
# Debug com logging
npm test -- --verbose

# Debug teste específico
npm test -- --testNamePattern="calcula available"
```

### Testes E2E

```bash
# Modo debug (abre browser)
npm run test:e2e:debug

# UI interativo
npm run test:e2e:ui

# Executar teste específico
npm run test:e2e -- --grep "carrega página analytics"
```

---

## 📝 Escrever Novos Testes

### Testes Unitários

```typescript
// src/hooks/__tests__/useExample.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useExample } from '../useExample';

jest.mock('../DataProvider', () => {
  let mockData = {};
  return {
    useData: () => mockData,
    __setMockData: (data) => { mockData = data; },
  };
});

describe('useExample', () => {
  beforeEach(() => {
    jest.requireMock('../DataProvider').__setMockData({});
  });

  it('should do something', () => {
    const { result } = renderHook(() => useExample());
    expect(result.current.value).toBeDefined();
  });
});
```

### Testes E2E

```typescript
// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Example Page', () => {
  test('carrega página', async ({ page }) => {
    await page.goto('/dashboard/example');
    await expect(page.locator('text=Example')).toBeVisible();
  });

  test('funcionalidade X funciona', async ({ page }) => {
    await page.goto('/dashboard/example');
    await page.click('button:has-text("Click me")');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## ✅ Checklist PR

Antes de fazer merge:

- [ ] Testes unitários passam (`npm test`)
- [ ] Testes E2E passam (`npm run test:e2e`)
- [ ] Coverage >= 70%
- [ ] Sem violações críticas de accessibility
- [ ] Build passa (`npm run build`)

---

## 🚨 Troubleshooting

### "Testes falham localmente mas passam no CI"

Verificar:
- Variáveis de ambiente
- Dados mockados
- Timezone (usar UTC)

### "Playwright não encontra o browser"

```bash
npx playwright install chromium
```

### "Coverage baixo"

Adicionar mais testes para:
- Edge cases
- Error handling
- Condições if/else

---

**Última atualização:** 24 de Abril de 2026
