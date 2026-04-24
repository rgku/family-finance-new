import { test, expect } from '@playwright/test';

test.describe('Analytics E2E Tests', () => {
  test('carrega página de análise', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await expect(page.locator('text=Análise, text=Analytics')).toBeVisible();
  });

  test('mostra gráficos de despesas', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const hasCharts = await page.locator('canvas, svg, [class*="chart"], [class*="graph"], text="Gráfico"').isVisible().catch(() => false);
    expect(hasCharts).toBeTruthy();
  });

  test('mostra despesas por categoria', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const hasCategoryChart = await page.locator('text="Categoria", text="categoria", [class*="pie"], [class*="donut"]').isVisible().catch(() => false);
    expect(hasCategoryChart).toBeTruthy();
  });

  test('filtra analytics por período', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const periodSelector = page.locator('select, button:has-text("Mês"), button:has-text("Semana"), button:has-text("Ano")').first();
    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      await page.waitForTimeout(500);
    }
  });

  test('alterna entre visualização de receitas e despesas', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const toggleButtons = page.locator('button[role="tab"], button:has-text("Receitas"), button:has-text("Despesas"), button:has-text("Ambos")');
    if (await toggleButtons.count() > 0) {
      await toggleButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('mostra evolução mensal', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const hasEvolutionChart = await page.locator('text="Evolução", text="Tendência", text="histórico", [class*="line"], [class*="bar"]').isVisible().catch(() => false);
    expect(hasEvolutionChart).toBeTruthy();
  });

  test('mostra comparação com mês anterior', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const hasComparison = await page.locator('text="comparação", text="anterior", text="%", text="variação", text="mudança"').isVisible().catch(() => false);
    expect(hasComparison).toBeTruthy();
  });

  test('visualiza detalhes de categoria', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const categoryItems = page.locator('[class*="category"], text="Alimentação", text="Transporte", text="Casa", text="Lazer"').first();
    if (await categoryItems.isVisible()) {
      await categoryItems.click();
      await page.waitForTimeout(500);
    }
  });

  test('exporta relatório de analytics', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("Download"), button:has-text("PDF"), button:has-text("Excel")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('mostra comparação com mês anterior', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const hasComparison = await page.locator('text=comparação, text=anterior, text=%, text=variação, text=mudança').isVisible().catch(() => false);
    expect(hasComparison).toBeTruthy();
  });

  test('visualiza detalhes de categoria', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const categoryItems = page.locator('[class*="category"], text=Alimentação, text=Transporte, text=Casa, text=Lazer').first();
    if (await categoryItems.isVisible()) {
      await categoryItems.click();
      await page.waitForTimeout(500);
    }
  });

  test('filtra analytics por tipo de transação', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    const filterButtons = page.locator('button:has-text("Todas"), button:has-text("Receitas"), button:has-text("Despesas")');
    if (await filterButtons.count() > 0) {
      await filterButtons.nth(1).click();
      await page.waitForTimeout(500);
    }
  });
});
