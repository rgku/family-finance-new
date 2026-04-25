import { test } from './fixtures';
import { expect } from '@playwright/test';
import { openMobileMenu } from './fixtures';

test.describe('Analytics E2E Tests', () => {
  test('carrega página de análise', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await expect(authenticatedPage.getByRole('heading', { name: /Análise|Analytics/i })).toBeVisible();
  });

  test('mostra gráficos de despesas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await authenticatedPage.waitForTimeout(1000);
    expect(await authenticatedPage.url()).toContain('/analytics');
  });

test.skip('mostra despesas por categoria', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    
    const hasCategoryChart = await authenticatedPage.locator('text="Categoria", text="categoria", [class*="pie"], [class*="donut"]').isVisible().catch(() => false);
    expect(hasCategoryChart).toBeTruthy();
  });

  test('filtra analytics por período', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const periodSelector = authenticatedPage.locator('select, button:has-text("Mês"), button:has-text("Semana"), button:has-text("Ano")').first();
    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('alterna entre visualização de receitas e despesas', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const toggleButtons = authenticatedPage.locator('button[role="tab"], button:has-text("Receitas"), button:has-text("Despesas"), button:has-text("Ambos")');
    if (await toggleButtons.count() > 0) {
      await toggleButtons.first().click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

test('mostra evolução mensal', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const hasEvolutionChart = await authenticatedPage.locator('text=Tendência Mensal').isVisible().catch(() => false);
    expect(hasEvolutionChart).toBeTruthy();
  });

  test('mostra comparação com mês anterior', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const hasComparison = await authenticatedPage.locator('text=vs Mês Anterior').isVisible().catch(() => false);
    expect(hasComparison).toBeTruthy();
  });

  test('visualiza detalhes de categoria', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const categoryItems = authenticatedPage.locator('text=Alimentação, text=Transporte, text=Casa, text=Lazer').first();
    if (await categoryItems.isVisible()) {
      await categoryItems.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('exporta relatório de analytics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const exportButton = authenticatedPage.locator('button:has-text("Exportar"), button:has-text("Download"), button:has-text("PDF"), button:has-text("Excel")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('filtra analytics por tipo de transação', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/analytics');
    await openMobileMenu(authenticatedPage);
    
    const filterButtons = authenticatedPage.locator('button:has-text("Todas"), button:has-text("Receitas"), button:has-text("Despesas")');
    if (await filterButtons.count() > 0) {
      await filterButtons.nth(1).click();
      await authenticatedPage.waitForTimeout(500);
    }
  });
});
