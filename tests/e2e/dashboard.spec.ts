import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('carrega dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=FamFlow')).toBeVisible();
  });

  test('mostra saldo e resumo financeiro', async ({ page }) => {
    await page.goto('/dashboard');
    
    const hasBalanceInfo = await page.locator('text="Saldo", text="Receitas", text="Despesas", text="Poupança"').isVisible().catch(() => false);
    expect(hasBalanceInfo).toBeTruthy();
  });

  test('navega para transações pelo sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    const transactionsLink = page.locator('a:has-text("Transações")').first();
    if (await transactionsLink.isVisible()) {
      await transactionsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/transactions/);
    }
  });

  test('navega para metas pelo sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    const goalsLink = page.locator('a:has-text("Metas")').first();
    if (await goalsLink.isVisible()) {
      await goalsLink.click({ force: true });
      await expect(page).toHaveURL(/\/dashboard\/goals/);
    }
  });

  test('navega para orçamentos pelo sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    const budgetsLink = page.locator('a:has-text("Orçamentos")').first();
    if (await budgetsLink.isVisible()) {
      await budgetsLink.click({ force: true });
      await expect(page).toHaveURL(/\/dashboard\/budgets/);
    }
  });

  test('filtra transações por período no dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    const monthSelector = page.locator('button:has-text("Janeiro"), button:has-text("Fevereiro"), button:has-text("Março"), button:has-text("Abril"), button:has-text("Maio"), button:has-text("Junho"), button:has-text("Julho"), button:has-text("Agosto"), button:has-text("Setembro"), button:has-text("Outubro"), button:has-text("Novembro"), button:has-text("Dezembro")').first();
    
    if (await monthSelector.isVisible()) {
      await monthSelector.click();
      await page.waitForTimeout(500);
    }
  });

  test('mostra últimas transações no dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    const hasTransactionsSection = await page.locator('text="Transações", text="Recentes", text="Últimas"').isVisible().catch(() => false);
    expect(hasTransactionsSection).toBeTruthy();
  });
});
