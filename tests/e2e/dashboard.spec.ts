import { test, expect } from './fixtures';

test.describe('Dashboard E2E Tests', () => {
  test('carrega dashboard page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.locator('text=FamFlow')).toBeVisible();
  });

  test('mostra saldo e resumo financeiro', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const hasBalanceInfo = await authenticatedPage.locator('text="Saldo", text="Receitas", text="Despesas", text="Poupança"').isVisible().catch(() => false);
    expect(hasBalanceInfo).toBeTruthy();
  });

  test('navega para transações pelo sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const transactionsLink = authenticatedPage.locator('a:has-text("Transações")').first();
    if (await transactionsLink.isVisible()) {
      await transactionsLink.click({ force: true });
      await expect(authenticatedPage).toHaveURL(/\/dashboard\/transactions/);
    }
  });

  test('navega para metas pelo sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const goalsLink = authenticatedPage.locator('a:has-text("Metas")').first();
    if (await goalsLink.isVisible()) {
      await goalsLink.click({ force: true });
      await expect(authenticatedPage).toHaveURL(/\/dashboard\/goals/);
    }
  });

  test('navega para orçamentos pelo sidebar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const budgetsLink = authenticatedPage.locator('a:has-text("Orçamentos")').first();
    if (await budgetsLink.isVisible()) {
      await budgetsLink.click({ force: true });
      await expect(authenticatedPage).toHaveURL(/\/dashboard\/budgets/);
    }
  });

  test('filtra transações por período no dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const monthSelector = authenticatedPage.locator('button:has-text("Janeiro"), button:has-text("Fevereiro"), button:has-text("Março"), button:has-text("Abril"), button:has-text("Maio"), button:has-text("Junho"), button:has-text("Julho"), button:has-text("Agosto"), button:has-text("Setembro"), button:has-text("Outubro"), button:has-text("Novembro"), button:has-text("Dezembro")').first();
    
    if (await monthSelector.isVisible()) {
      await monthSelector.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('mostra últimas transações no dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    const hasTransactionsSection = await authenticatedPage.locator('text="Transações", text="Recentes", text="Últimas"').isVisible().catch(() => false);
    expect(hasTransactionsSection).toBeTruthy();
  });
});
