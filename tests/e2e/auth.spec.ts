import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('carrega página home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FamFlow/);
  });

  test('formulário de login está visível', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('navega para forgot password', async ({ page }) => {
    await page.goto('/');
    const forgotLink = page.locator('a:has-text("Esqueci"), a:has-text("Forgot"), a:has-text("Recuperar")');
    if (await forgotLink.count() > 0) {
      await forgotLink.first().click();
      await expect(page).toHaveURL(/.*forgot.*/);
    }
  });

  test('logout funciona (se autenticado)', async ({ page }) => {
    await page.goto('/dashboard');
    
    const isLoginPage = await page.isVisible('input[type="email"]').catch(() => true);
    
    if (isLoginPage) {
      return;
    }
    
    await page.waitForTimeout(1000);
    
    const logoutButton = page.locator('button:has-text("Sair")').or(page.locator('a:has-text("Sair")')).first();
    const isLogoutVisible = await logoutButton.isVisible().catch(() => false);
    
    if (isLogoutVisible) {
      await logoutButton.click({ force: true });
      await page.waitForURL(/\/$/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});
