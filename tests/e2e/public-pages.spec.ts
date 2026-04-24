import { test, expect } from '@playwright/test';

test.describe('E2E Tests - Páginas Públicas', () => {
  test('✓ Home page carrega', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FamFlow/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('✓ Forgot password page carrega', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('body')).toBeVisible();
  });

  test('✓ Dashboard redireciona para login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*dashboard/);
  });

  test('✓ Analytics redireciona para login', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*analytics/);
  });

  test('✓ Budgets redireciona para login', async ({ page }) => {
    await page.goto('/dashboard/budgets');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*budgets/);
  });

  test('✓ Goals redireciona para login', async ({ page }) => {
    await page.goto('/dashboard/goals');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*goals/);
  });

  test('✓ Transactions redireciona para login', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*transactions/);
  });

  test('✓ Settings redireciona para login', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForURL(/\/$|\/\?redirect=.*/);
    expect(page.url()).toMatch(/\?redirect=.*settings/);
  });
});
